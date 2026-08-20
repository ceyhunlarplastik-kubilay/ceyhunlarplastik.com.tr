import { describe, expect, it, vi } from "vitest"
import { refreshExpiringGooglePlaceCoordinates } from "@/core/helpers/crm/googlePlacesCoordinateRefresh"

vi.mock("@/core/db/prisma", () => ({ prisma: {} }))

describe("Google Places coordinate refresh", () => {
    it("refreshes moved places and clears all coordinates that remain expired", async () => {
        const findMany = vi.fn().mockResolvedValue([
            { id: "address-1", geocodingPlaceId: "place-1" },
        ])
        const update = vi.fn().mockResolvedValue({})
        const updateMany = vi.fn().mockResolvedValue({ count: 2 })
        const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
            id: "place-1",
            movedPlaceId: "place-2",
            location: { latitude: 40.1, longitude: 29.2 },
        }), { status: 200 }))

        const result = await refreshExpiringGooglePlaceCoordinates({
            apiKey: "server-key",
            database: { customerAddress: { findMany, update, updateMany } } as never,
            fetcher,
            now: new Date("2026-08-18T00:00:00.000Z"),
        })

        expect(update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: "address-1" },
            data: expect.objectContaining({
                geocodingPlaceId: "place-2",
                latitude: 40.1,
                longitude: 29.2,
                geocodingExpiresAt: new Date("2026-09-16T00:00:00.000Z"),
            }),
        }))
        // Temizlenmiş satırlar filtre dışında kalmalı: aksi halde her gün aynı
        // satırlara aynı NULL'lar yazılır ve ölü tuple birikir.
        expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                geocodingProvider: "google_places",
                geocodingExpiresAt: { lte: new Date("2026-08-18T00:00:00.000Z") },
                OR: [
                    { latitude: { not: null } },
                    { longitude: { not: null } },
                    { geocodedAt: { not: null } },
                    { geocodingLabel: { not: null } },
                ],
            },
            data: expect.objectContaining({ latitude: null, longitude: null }),
        }))
        expect(result).toEqual({
            attempted: 1,
            refreshed: 1,
            failed: 0,
            expiredCoordinatesCleared: 2,
        })
    })
})
