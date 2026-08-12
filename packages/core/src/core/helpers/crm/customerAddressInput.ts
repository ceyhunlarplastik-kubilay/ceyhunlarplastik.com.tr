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
        geocodingProvider: textOrNull(body.geocodingProvider) ?? null,
        geocodingPlaceId: textOrNull(body.geocodingPlaceId) ?? null,
        geocodingLabel: textOrNull(body.geocodingLabel) ?? null,
        geocodingRaw: body.geocodingRaw ?? null,
        geocodedAt: dateOrNull(body.geocodedAt) ?? null,
        locationVerifiedAt,
        locationVerifiedByUserId,
        isPrimary: body.isPrimary ?? false,
        isBilling: body.isBilling ?? false,
        isShipping: body.isShipping ?? true,
        note: textOrNull(body.note) ?? null,
    }
}
