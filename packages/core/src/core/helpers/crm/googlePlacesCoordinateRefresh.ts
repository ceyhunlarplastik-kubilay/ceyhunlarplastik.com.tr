import { prisma } from "@/core/db/prisma"
import {
    fetchGooglePlaceLocation,
    GOOGLE_PLACES_COORDINATE_TTL_DAYS,
    GOOGLE_PLACES_PROVIDER,
    GOOGLE_PLACES_REFRESH_LEAD_DAYS,
} from "@/core/helpers/crm/customerAddressInput"
import { Prisma } from "@/prisma/generated/prisma/client"

export { GOOGLE_PLACES_REFRESH_LEAD_DAYS }
export const GOOGLE_PLACES_DAILY_REFRESH_LIMIT = 100

type RefreshDatabase = Pick<typeof prisma, "customerAddress">

type RefreshOptions = {
    apiKey?: string
    database?: RefreshDatabase
    fetcher?: typeof fetch
    now?: Date
    limit?: number
}

function addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

/** Günlük cron tarafından çağrılır; Google'a en fazla `limit` kez gider. */
export async function refreshExpiringGooglePlaceCoordinates({
    apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY,
    database = prisma,
    fetcher = fetch,
    now = new Date(),
    limit = GOOGLE_PLACES_DAILY_REFRESH_LIMIT,
}: RefreshOptions = {}) {
    if (!apiKey?.trim()) {
        throw new Error("GOOGLE_MAPS_SERVER_API_KEY is not configured")
    }

    const refreshBefore = addDays(now, GOOGLE_PLACES_REFRESH_LEAD_DAYS)
    const candidates = await database.customerAddress.findMany({
        where: {
            geocodingProvider: GOOGLE_PLACES_PROVIDER,
            geocodingPlaceId: { not: null },
            OR: [
                { geocodingExpiresAt: null },
                { geocodingExpiresAt: { lte: refreshBefore } },
            ],
        },
        orderBy: [
            { geocodingExpiresAt: "asc" },
            { geocodedAt: "asc" },
            { id: "asc" },
        ],
        take: Math.min(Math.max(limit, 1), GOOGLE_PLACES_DAILY_REFRESH_LIMIT),
        select: {
            id: true,
            geocodingPlaceId: true,
        },
    })

    let refreshed = 0
    let failed = 0

    // Düşük kota ve öngörülebilir trafik için küçük gruplar halinde ilerle.
    for (let offset = 0; offset < candidates.length; offset += 5) {
        const batch = candidates.slice(offset, offset + 5)
        await Promise.all(batch.map(async (candidate) => {
            try {
                const place = await fetchGooglePlaceLocation({
                    placeId: candidate.geocodingPlaceId!,
                    apiKey,
                    fetcher,
                })
                await database.customerAddress.update({
                    where: { id: candidate.id },
                    data: {
                        geocodingPlaceId: place.placeId,
                        latitude: place.latitude,
                        longitude: place.longitude,
                        geocodingLabel: null,
                        geocodingRaw: Prisma.DbNull,
                        geocodedAt: now,
                        geocodingExpiresAt: addDays(now, GOOGLE_PLACES_COORDINATE_TTL_DAYS),
                    },
                })
                refreshed += 1
            } catch (error) {
                failed += 1
                console.warn("Google Places coordinate refresh failed", {
                    addressId: candidate.id,
                    error: error instanceof Error ? error.message : String(error),
                })
            }
        }))
    }

    // Google koordinatları 29 günü aşamaz. Yenilenemeyen veya bu günlük batch'e
    // giremeyen süresi dolmuş satırlardaki koordinatları temizle; place ID kalır.
    // Temizlenmiş satırlar filtre dışında kalmalı: aksi halde her gün aynı satırlara
    // aynı NULL'lar yazılır ve ölü tuple birikimi sürekli büyür.
    const expired = await database.customerAddress.updateMany({
        where: {
            geocodingProvider: GOOGLE_PLACES_PROVIDER,
            geocodingExpiresAt: { lte: now },
            OR: [
                { latitude: { not: null } },
                { longitude: { not: null } },
                { geocodedAt: { not: null } },
                { geocodingLabel: { not: null } },
            ],
        },
        data: {
            latitude: null,
            longitude: null,
            geocodingLabel: null,
            geocodingRaw: Prisma.DbNull,
            geocodedAt: null,
        },
    })

    return {
        attempted: candidates.length,
        refreshed,
        failed,
        expiredCoordinatesCleared: expired.count,
    }
}
