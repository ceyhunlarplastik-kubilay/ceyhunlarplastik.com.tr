import createError from "http-errors"
import type { CustomerAddressMutationInput } from "@/core/helpers/prisma/customers/repository"
import type { Prisma } from "@/prisma/generated/prisma/client"

/**
 * Adres gövdesinin API sınırından repository girdisine normalize edilmesi.
 *
 * ProtectedApi (satış + müşteri portalı) ve AdminApi (veri girişi paneli,
 * potansiyel müşteri) aynı kuralı paylaşır — koordinat/doğrulama davranışı
 * yüzeyler arasında ayrışmasın diye burada tek yerde durur.
 */

export type CustomerAddressBody = {
    label: string
    contactName?: string | null
    phone?: string | null
    email?: string | null
    countryId?: number | null
    stateId?: number | null
    cityId?: number | null
    country?: string | null
    stateName?: string | null
    city: string
    district?: string | null
    line1: string
    line2?: string | null
    postalCode?: string | null
    taxOffice?: string | null
    taxNumber?: string | null
    latitude?: number | null
    longitude?: number | null
    locationSource?: "MANUAL_PIN" | "GEOCODED" | "IMPORTED" | "CUSTOMER_SUBMITTED" | null
    locationAccuracy?: "EXACT" | "STREET" | "DISTRICT" | "CITY" | "UNKNOWN" | null
    geocodingProvider?: string | null
    geocodingPlaceId?: string | null
    geocodingLabel?: string | null
    geocodingRaw?: Prisma.InputJsonValue | null
    geocodedAt?: string | null
    locationVerifiedAt?: string | null
    locationVerifiedByUserId?: string | null
    isPrimary?: boolean
    isBilling?: boolean
    isShipping?: boolean
    note?: string | null
}

export type NormalizeCustomerAddressOptions = {
    defaultLocationSource: "MANUAL_PIN" | "GEOCODED" | "CUSTOMER_SUBMITTED"
    verifiedByUserId?: string | null
    /** Portal (müşteri) girişlerinde false: konumu personel doğrular. */
    allowVerification?: boolean
}

export const GOOGLE_PLACES_PROVIDER = "google_places"
export const GOOGLE_PLACES_COORDINATE_TTL_DAYS = 29
/** Cron bu kadar gün kala yeniler; etkileşimli akış o pencereye girmemiş
 *  koordinatı yeniden çözmez. */
export const GOOGLE_PLACES_REFRESH_LEAD_DAYS = 7
/** Google yanıt vermezse Lambda'nın tamamını (ve açık transaction'ları) bloke
 *  etmesin. */
export const GOOGLE_PLACES_REQUEST_TIMEOUT_MS = 5_000

/**
 * Sağlayıcı adı istemciden serbest metin olarak gelir. Karşılaştırma büyük/küçük
 * harfe duyarlı kalırsa `Google_Places` gibi bir değer hem sunucu tarafı yeniden
 * çözümlemeyi hem de TTL kırpmasını atlatır; bu yüzden tek kanonik biçime indiririz.
 */
export function normalizeGeocodingProvider(value: string | null | undefined) {
    const trimmed = value?.trim()
    if (!trimmed) return null
    return trimmed.toLowerCase() === GOOGLE_PLACES_PROVIDER ? GOOGLE_PLACES_PROVIDER : trimmed
}

export function isGooglePlacesProvider(value: string | null | undefined) {
    return normalizeGeocodingProvider(value) === GOOGLE_PLACES_PROVIDER
}

type GooglePlaceLocationResponse = {
    id?: string
    movedPlaceId?: string
    location?: {
        latitude?: number
        longitude?: number
    }
}

type GooglePlacesErrorResponse = {
    error?: {
        status?: unknown
        message?: unknown
        details?: Array<{
            reason?: unknown
        }>
    }
}

class GooglePlacesRequestError extends Error {
    readonly httpStatus: number
    readonly googleStatus: string | null
    readonly googleReason: string | null
    readonly googleMessage: string | null

    constructor({
        httpStatus,
        googleStatus,
        googleReason,
        googleMessage,
    }: {
        httpStatus: number
        googleStatus: string | null
        googleReason: string | null
        googleMessage: string | null
    }) {
        const classification = [googleStatus, googleReason].filter(Boolean).join("/")
        const description = googleMessage ? `: ${googleMessage}` : ""
        super(`Google Places request failed (${httpStatus}${classification ? ` ${classification}` : ""}${description})`)
        this.name = "GooglePlacesRequestError"
        this.httpStatus = httpStatus
        this.googleStatus = googleStatus
        this.googleReason = googleReason
        this.googleMessage = googleMessage
    }
}

function safeGoogleErrorText(value: unknown) {
    if (typeof value !== "string") return null
    const normalized = value.replace(/\s+/g, " ").trim()
    return normalized ? normalized.slice(0, 500) : null
}

/**
 * Kayıtlı adresin Google alanları. Aynı place ID hâlâ taze koordinat taşıyorsa
 * Google'a tekrar gitmeyiz: etiket düzenlemesi ücretli bir Place Details isteği
 * doğurmasın ve Google kesintisi metin düzenlemesini bloke etmesin.
 */
export type StoredGooglePlaceLocation = {
    geocodingProvider?: string | null
    geocodingPlaceId?: string | null
    geocodingExpiresAt?: Date | string | null
    latitude?: unknown
    longitude?: unknown
}

type PrepareCustomerAddressOptions = NormalizeCustomerAddressOptions & {
    apiKey?: string
    fetcher?: typeof fetch
    now?: () => Date
    /** Güncellenen adresin mevcut hâli; yalnız yeniden çözümlemeyi atlamak için. */
    existing?: StoredGooglePlaceLocation | null
}

function addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function coordinateOrNull(value: unknown) {
    if (value === null || value === undefined) return null
    const parsed = typeof value === "number" ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

/**
 * Depodaki koordinat aynı place ID'ye ait ve cron'un yenileme penceresine
 * girmemişse yeniden kullanılabilir.
 */
function reusableStoredLocation(
    existing: StoredGooglePlaceLocation | null | undefined,
    placeId: string,
    now: Date,
) {
    if (!existing || !isGooglePlacesProvider(existing.geocodingProvider)) return null
    if (existing.geocodingPlaceId?.trim() !== placeId) return null

    const expiresAt = existing.geocodingExpiresAt instanceof Date
        ? existing.geocodingExpiresAt
        : existing.geocodingExpiresAt
            ? new Date(existing.geocodingExpiresAt)
            : null
    if (!expiresAt || Number.isNaN(expiresAt.getTime())) return null
    if (expiresAt.getTime() <= addDays(now, GOOGLE_PLACES_REFRESH_LEAD_DAYS).getTime()) return null

    const latitude = coordinateOrNull(existing.latitude)
    const longitude = coordinateOrNull(existing.longitude)
    if (latitude === null || longitude === null) return null

    return { placeId, latitude, longitude, expiresAt }
}

export async function fetchGooglePlaceLocation({
    placeId,
    apiKey,
    fetcher = fetch,
}: {
    placeId: string
    apiKey: string
    fetcher?: typeof fetch
}) {
    const response = await fetcher(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
        {
            headers: {
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "id,movedPlaceId,location",
            },
            // Yanıt vermeyen bağlantı Lambda süresini (ve çağıran akışı) tüketmesin.
            signal: AbortSignal.timeout(GOOGLE_PLACES_REQUEST_TIMEOUT_MS),
        },
    )

    if (!response.ok) {
        let googleError: GooglePlacesErrorResponse | null = null
        try {
            googleError = await response.json() as GooglePlacesErrorResponse
        } catch {
            // Google JSON döndürmezse HTTP durumu yine tanı için yeterlidir.
        }

        throw new GooglePlacesRequestError({
            httpStatus: response.status,
            googleStatus: safeGoogleErrorText(googleError?.error?.status),
            googleReason: safeGoogleErrorText(
                googleError?.error?.details?.find((detail) => detail?.reason)?.reason,
            ),
            googleMessage: safeGoogleErrorText(googleError?.error?.message),
        })
    }

    const place = await response.json() as GooglePlaceLocationResponse
    const latitude = place.location?.latitude
    const longitude = place.location?.longitude
    if (
        typeof latitude !== "number"
        || !Number.isFinite(latitude)
        || latitude < -90
        || latitude > 90
        || typeof longitude !== "number"
        || !Number.isFinite(longitude)
        || longitude < -180
        || longitude > 180
    ) {
        throw new Error("Google Places returned an invalid location")
    }

    return {
        placeId: place.movedPlaceId?.trim() || place.id?.trim() || placeId,
        latitude,
        longitude,
    }
}

function textOrNull(value: string | null | undefined) {
    if (value === undefined) return undefined
    if (value === null) return null
    const trimmed = value.trim()
    return trimmed ? trimmed : null
}

function dateOrNull(value: string | null | undefined) {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date
}

function numberOrNull(value: number | null | undefined) {
    return typeof value === "number" && Number.isFinite(value) ? value : null
}

function resolveLocationSource(
    body: CustomerAddressBody,
    fallback: NormalizeCustomerAddressOptions["defaultLocationSource"],
) {
    if (body.locationSource) return body.locationSource
    if (fallback === "CUSTOMER_SUBMITTED") return "CUSTOMER_SUBMITTED"
    return body.geocodingProvider || body.geocodingLabel ? "GEOCODED" : fallback
}

export function normalizeCustomerAddressInput(
    body: CustomerAddressBody,
    options: NormalizeCustomerAddressOptions,
): CustomerAddressMutationInput {
    const latitude = numberOrNull(body.latitude)
    const longitude = numberOrNull(body.longitude)
    const hasCoordinates = latitude !== null && longitude !== null

    const locationVerifiedAt = options.allowVerification
        ? dateOrNull(body.locationVerifiedAt) ?? (hasCoordinates ? new Date() : null)
        : null
    const locationVerifiedByUserId = options.allowVerification
        ? textOrNull(body.locationVerifiedByUserId) ?? options.verifiedByUserId ?? null
        : null

    return {
        label: body.label.trim(),
        contactName: textOrNull(body.contactName) ?? null,
        phone: textOrNull(body.phone) ?? null,
        email: textOrNull(body.email) ?? null,
        countryId: body.countryId ?? null,
        stateId: body.stateId ?? null,
        cityId: body.cityId ?? null,
        country: body.country?.trim() || "Turkiye",
        city: body.city.trim(),
        district: textOrNull(body.district) ?? null,
        line1: body.line1.trim(),
        line2: textOrNull(body.line2) ?? null,
        postalCode: textOrNull(body.postalCode) ?? null,
        taxOffice: textOrNull(body.taxOffice) ?? null,
        taxNumber: textOrNull(body.taxNumber) ?? null,
        latitude,
        longitude,
        locationSource: resolveLocationSource(body, options.defaultLocationSource),
        locationAccuracy: body.locationAccuracy ?? null,
        geocodingProvider: normalizeGeocodingProvider(body.geocodingProvider),
        geocodingPlaceId: textOrNull(body.geocodingPlaceId) ?? null,
        geocodingLabel: textOrNull(body.geocodingLabel) ?? null,
        geocodingRaw: body.geocodingRaw ?? null,
        geocodedAt: dateOrNull(body.geocodedAt) ?? null,
        geocodingExpiresAt: null,
        locationVerifiedAt,
        locationVerifiedByUserId,
        isPrimary: body.isPrimary ?? false,
        isBilling: body.isBilling ?? false,
        isShipping: body.isShipping ?? true,
        note: textOrNull(body.note) ?? null,
    }
}

/**
 * Google kaynaklı koordinatı tarayıcıdan kabul etmez. Place ID sunucuda tekrar
 * çözülür; yalnız place ID + koordinat + sunucu üretimli 29 günlük süre saklanır.
 */
export async function prepareCustomerAddressInput(
    body: CustomerAddressBody,
    options: PrepareCustomerAddressOptions,
): Promise<CustomerAddressMutationInput> {
    if (!isGooglePlacesProvider(body.geocodingProvider)) {
        return normalizeCustomerAddressInput(body, options)
    }

    const placeId = body.geocodingPlaceId?.trim()
    if (!placeId) {
        throw new createError.BadRequest("Google Places konumu için place_id gerekli.")
    }

    const now = options.now?.() ?? new Date()
    const reusable = reusableStoredLocation(options.existing, placeId, now)
    const resolved = reusable ?? await resolveGooglePlaceForAddress(placeId, options)
    const expiresAt = reusable
        ? reusable.expiresAt
        : addDays(now, GOOGLE_PLACES_COORDINATE_TTL_DAYS)

    return {
        ...normalizeCustomerAddressInput({
            ...body,
            latitude: resolved.latitude,
            longitude: resolved.longitude,
            locationSource: "GEOCODED",
            locationAccuracy: "EXACT",
            geocodingProvider: GOOGLE_PLACES_PROVIDER,
            geocodingPlaceId: resolved.placeId,
            geocodingLabel: null,
            geocodingRaw: null,
            geocodedAt: now.toISOString(),
        }, options),
        geocodingExpiresAt: expiresAt,
    }
}

async function resolveGooglePlaceForAddress(
    placeId: string,
    options: PrepareCustomerAddressOptions,
) {
    const apiKey = options.apiKey?.trim() || process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim()
    if (!apiKey) {
        throw new createError.ServiceUnavailable("Google konum doğrulama servisi yapılandırılmamış.")
    }

    try {
        return await fetchGooglePlaceLocation({
            placeId,
            apiKey,
            fetcher: options.fetcher,
        })
    } catch (error) {
        console.warn("Google Places address verification failed", {
            placeId,
            ...(error instanceof GooglePlacesRequestError
                ? {
                    httpStatus: error.httpStatus,
                    googleStatus: error.googleStatus,
                    googleReason: error.googleReason,
                    googleMessage: error.googleMessage,
                }
                : { error: error instanceof Error ? error.message : String(error) }),
        })

        // 4xx kalıcıdır (silinmiş/geçersiz place ID, hatalı istek): "sonra tekrar
        // deneyin" demek kullanıcıyı sonsuz denemeye iter. 408/429 ve 5xx geçicidir.
        if (
            error instanceof GooglePlacesRequestError
            && error.httpStatus >= 400
            && error.httpStatus < 500
            && error.httpStatus !== 408
            && error.httpStatus !== 429
        ) {
            throw new createError.BadRequest(
                "Seçilen Google konumu artık geçerli değil. Haritadan konumu yeniden seçin veya koordinatı elle girin.",
            )
        }

        throw new createError.ServiceUnavailable(
            "Google konumu şu anda doğrulanamıyor. Manuel koordinat kullanabilir veya daha sonra tekrar deneyebilirsiniz.",
        )
    }
}
