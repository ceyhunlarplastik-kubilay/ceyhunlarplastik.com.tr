import { Prisma } from "../../../../core/prisma/generated/prisma/client"
import { prisma } from "../../../../core/src/core/db/prisma"
import type {
    GeocodeAddressParts,
    GeocodeResult,
    LocationAccuracy,
    ReverseGeocodeResult,
} from "@/features/customerLocations/types"

const GEOCODING_PROVIDER = "nominatim"
const SEARCH_SUCCESS_TTL_MS = 30 * 24 * 60 * 60 * 1000
const EMPTY_RESULT_TTL_MS = 6 * 60 * 60 * 1000
const PROVIDER_COOLDOWN_MS = 1200
const inflightRequests = new Map<string, Promise<unknown>>()
const cooldownByProvider = new Map<string, number>()

type NominatimSearchItem = {
    place_id?: number
    lat: string
    lon: string
    display_name: string
    addresstype?: string
    address?: Record<string, string | undefined>
}

type NominatimReverseItem = NominatimSearchItem

function normalizeQuery(value: string) {
    return value.trim().replace(/\s+/g, " ")
}

function buildSearchCacheKey(query: string) {
    return normalizeQuery(query).toLocaleLowerCase("tr-TR")
}

function buildReverseCacheKey(lat: number, lng: number) {
    return `${lat.toFixed(6)},${lng.toFixed(6)}`
}

function resolveAccuracy(value?: string): LocationAccuracy {
    switch (value) {
        case "house":
        case "building":
        case "residential":
        case "amenity":
        case "office":
        case "commercial":
        case "shop":
        case "school":
            return "EXACT"
        case "road":
        case "street":
        case "pedestrian":
            return "STREET"
        case "suburb":
        case "quarter":
        case "neighbourhood":
        case "neighborhood":
        case "hamlet":
        case "village":
        case "district":
            return "DISTRICT"
        case "city":
        case "town":
        case "municipality":
        case "county":
        case "province":
        case "state":
            return "CITY"
        default:
            return "UNKNOWN"
    }
}

function buildAddressParts(address?: Record<string, string | undefined>): GeocodeAddressParts {
    if (!address) return {}

    const line1 = [address.house_number, address.road].filter(Boolean).join(" ").trim()
    const district = address.suburb
        ?? address.neighbourhood
        ?? address.neighborhood
        ?? address.quarter
        ?? address.city_district
        ?? address.township
        ?? null
    const city = address.city
        ?? address.town
        ?? address.municipality
        ?? address.county
        ?? address.state_district
        ?? address.province
        ?? null

    return {
        country: address.country ?? null,
        stateName: address.state ?? address.province ?? null,
        city,
        district,
        line1: line1 || null,
        postalCode: address.postcode ?? null,
    }
}

async function enrichAddressParts(parts: GeocodeAddressParts, address?: Record<string, string | undefined>) {
    const country = address?.country_code
        ? await prisma.geoCountry.findFirst({
            where: { iso2: address.country_code.toUpperCase() },
            select: { id: true, name: true },
        })
        : parts.country
            ? await prisma.geoCountry.findFirst({
                where: { name: { equals: parts.country, mode: "insensitive" } },
                select: { id: true, name: true },
            })
            : null

    const state = parts.stateName
        ? await prisma.geoState.findFirst({
            where: {
                ...(country?.id ? { countryId: country.id } : {}),
                name: { equals: parts.stateName, mode: "insensitive" },
            },
            select: { id: true, name: true, countryId: true },
        })
        : null

    const city = parts.city
        ? await prisma.geoCity.findFirst({
            where: {
                ...(state?.id
                    ? { stateId: state.id }
                    : country?.id
                        ? { countryId: country.id }
                        : {}),
                name: { equals: parts.city, mode: "insensitive" },
            },
            select: { id: true, name: true },
        })
        : null

    return {
        ...parts,
        countryId: country?.id ?? null,
        stateId: state?.id ?? null,
        cityId: city?.id ?? null,
        country: country?.name ?? parts.country ?? null,
        stateName: state?.name ?? parts.stateName ?? null,
        city: city?.name ?? parts.city ?? null,
    }
}

async function mapNominatimItem(item: NominatimSearchItem): Promise<GeocodeResult | null> {
    const latitude = Number(item.lat)
    const longitude = Number(item.lon)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null
    }

    const baseParts = buildAddressParts(item.address)
    const addressParts = await enrichAddressParts(baseParts, item.address)

    return {
        label: item.display_name,
        latitude,
        longitude,
        provider: "nominatim",
        providerPlaceId: item.place_id ? String(item.place_id) : null,
        locationAccuracy: resolveAccuracy(item.addresstype),
        addressParts,
        raw: item,
    }
}

function buildNominatimHeaders() {
    return {
        "Accept": "application/json",
        "Accept-Language": "tr,en;q=0.8",
        "User-Agent": "CeyhunlarPlastik/1.0 (+https://ceyhunlarplastik.com.tr)",
    }
}

async function withProviderRequest<T>(key: string, factory: () => Promise<T>) {
    const existing = inflightRequests.get(key)
    if (existing) {
        return existing as Promise<T>
    }

    const promise = (async () => {
        const lastRequestAt = cooldownByProvider.get(GEOCODING_PROVIDER) ?? 0
        const waitMs = Math.max(0, lastRequestAt + PROVIDER_COOLDOWN_MS - Date.now())
        if (waitMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, waitMs))
        }

        try {
            return await factory()
        } finally {
            cooldownByProvider.set(GEOCODING_PROVIDER, Date.now())
        }
    })()

    inflightRequests.set(key, promise)

    try {
        return await promise
    } finally {
        inflightRequests.delete(key)
    }
}

async function readCache<T>(queryType: "SEARCH" | "REVERSE", cacheKey: string): Promise<{ hit: boolean; value: T | null }> {
    const entry = await prisma.geocodingCache.findUnique({
        where: {
            provider_queryType_cacheKey: {
                provider: GEOCODING_PROVIDER,
                queryType,
                cacheKey,
            },
        },
        select: {
            responseJson: true,
            expiresAt: true,
        },
    })

    if (!entry || entry.expiresAt.getTime() <= Date.now()) {
        return { hit: false, value: null }
    }

    return { hit: true, value: entry.responseJson as T }
}

async function writeCache(
    queryType: "SEARCH" | "REVERSE",
    cacheKey: string,
    responseJson: Prisma.InputJsonValue | typeof Prisma.JsonNull,
    hasData: boolean,
) {
    const ttl = hasData ? SEARCH_SUCCESS_TTL_MS : EMPTY_RESULT_TTL_MS

    await prisma.geocodingCache.upsert({
        where: {
            provider_queryType_cacheKey: {
                provider: GEOCODING_PROVIDER,
                queryType,
                cacheKey,
            },
        },
        create: {
            provider: GEOCODING_PROVIDER,
            queryType,
            cacheKey,
            responseJson,
            expiresAt: new Date(Date.now() + ttl),
        },
        update: {
            responseJson,
            expiresAt: new Date(Date.now() + ttl),
        },
    })
}

async function fetchNominatimSearch(query: string) {
    const url = new URL("https://nominatim.openstreetmap.org/search")
    url.searchParams.set("format", "jsonv2")
    url.searchParams.set("addressdetails", "1")
    url.searchParams.set("limit", "5")
    url.searchParams.set("q", query)

    const response = await fetch(url, {
        headers: buildNominatimHeaders(),
        cache: "no-store",
    })

    if (!response.ok) {
        throw new Error(`Geocoding search failed with status ${response.status}`)
    }

    return response.json() as Promise<NominatimSearchItem[]>
}

async function fetchNominatimReverse(lat: number, lng: number) {
    const url = new URL("https://nominatim.openstreetmap.org/reverse")
    url.searchParams.set("format", "jsonv2")
    url.searchParams.set("addressdetails", "1")
    url.searchParams.set("lat", lat.toString())
    url.searchParams.set("lon", lng.toString())

    const response = await fetch(url, {
        headers: buildNominatimHeaders(),
        cache: "no-store",
    })

    if (response.status === 404) {
        return null
    }

    if (!response.ok) {
        throw new Error(`Reverse geocoding failed with status ${response.status}`)
    }

    return response.json() as Promise<NominatimReverseItem>
}

export async function searchGeocoding(query: string) {
    const normalizedQuery = normalizeQuery(query)
    if (normalizedQuery.length < 3) {
        throw new Error("En az 3 karakterlik bir arama girin.")
    }

    const cacheKey = buildSearchCacheKey(normalizedQuery)
    const cached = await readCache<GeocodeResult[]>("SEARCH", cacheKey)
    if (cached.hit) {
        return cached.value ?? []
    }

    const results = await withProviderRequest(`search:${cacheKey}`, async () => {
        const response = await fetchNominatimSearch(normalizedQuery)
        const mapped = (await Promise.all(response.map((item) => mapNominatimItem(item)))).filter(Boolean) as GeocodeResult[]
        await writeCache("SEARCH", cacheKey, mapped as unknown as Prisma.InputJsonValue, mapped.length > 0)
        return mapped
    })

    return results
}

export async function reverseGeocoding(lat: number, lng: number) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Geçerli koordinat gönderin.")
    }

    const cacheKey = buildReverseCacheKey(lat, lng)
    const cached = await readCache<ReverseGeocodeResult | null>("REVERSE", cacheKey)
    if (cached.hit) {
        return cached.value
    }

    const result = await withProviderRequest(`reverse:${cacheKey}`, async () => {
        const response = await fetchNominatimReverse(lat, lng)
        const mapped = response ? await mapNominatimItem(response) : null
        await writeCache(
            "REVERSE",
            cacheKey,
            mapped ? mapped as unknown as Prisma.InputJsonValue : Prisma.JsonNull,
            Boolean(mapped),
        )
        return mapped
    })

    return result
}
