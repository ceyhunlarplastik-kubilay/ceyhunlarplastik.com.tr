import { describe, expect, it, vi } from "vitest"
import {
    fetchGooglePlaceLocation,
    prepareCustomerAddressInput,
} from "@/core/helpers/crm/customerAddressInput"

const address = {
    label: "Merkez",
    city: "İstanbul",
    line1: "Örnek Cadde 1",
    latitude: 1,
    longitude: 2,
    geocodingProvider: "google_places",
    geocodingPlaceId: "old-place-id",
    geocodingLabel: "Google tarafından gösterilen adres",
    geocodingRaw: { mustNotPersist: true },
} as const

describe("Google Places customer address lifecycle", () => {
    it("trusts the place ID, verifies coordinates on the server and creates a 29-day expiry", async () => {
        const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
            id: "old-place-id",
            movedPlaceId: "new-place-id",
            location: { latitude: 41.0082, longitude: 28.9784 },
        }), { status: 200 }))
        const now = new Date("2026-08-18T10:00:00.000Z")

        const result = await prepareCustomerAddressInput(address, {
            defaultLocationSource: "MANUAL_PIN",
            allowVerification: false,
            apiKey: "server-key",
            fetcher,
            now: () => now,
        })

        expect(result).toMatchObject({
            latitude: 41.0082,
            longitude: 28.9784,
            locationSource: "GEOCODED",
            locationAccuracy: "EXACT",
            geocodingProvider: "google_places",
            geocodingPlaceId: "new-place-id",
            geocodingLabel: null,
            geocodingRaw: null,
            geocodedAt: now,
            geocodingExpiresAt: new Date("2026-09-16T10:00:00.000Z"),
        })
        expect(fetcher).toHaveBeenCalledWith(
            "https://places.googleapis.com/v1/places/old-place-id",
            expect.objectContaining({
                headers: {
                    "X-Goog-Api-Key": "server-key",
                    "X-Goog-FieldMask": "id,movedPlaceId,location",
                },
            }),
        )
    })

    it("rejects an invalid or missing location from Place Details", async () => {
        const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
            id: "old-place-id",
        }), { status: 200 }))

        await expect(fetchGooglePlaceLocation({
            placeId: "old-place-id",
            apiKey: "server-key",
            fetcher,
        })).rejects.toThrow("invalid location")
    })

    it("preserves Google's permission error reason without exposing the API key", async () => {
        const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
            error: {
                code: 403,
                status: "PERMISSION_DENIED",
                message: "Requests from this server are blocked by an API key restriction.",
                details: [{
                    reason: "API_KEY_SERVICE_BLOCKED",
                }],
            },
        }), { status: 403 }))

        const request = fetchGooglePlaceLocation({
            placeId: "blocked-place-id",
            apiKey: "must-not-appear-in-error",
            fetcher,
        })

        await expect(request).rejects.toThrow(
            "Google Places request failed (403 PERMISSION_DENIED/API_KEY_SERVICE_BLOCKED: Requests from this server are blocked by an API key restriction.)",
        )
        await expect(request).rejects.not.toThrow("must-not-appear-in-error")
    })

    it("büyük/küçük harf değişimiyle sunucu doğrulaması atlatılamaz", async () => {
        const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
            id: "place-1",
            location: { latitude: 41.0082, longitude: 28.9784 },
        }), { status: 200 }))

        const result = await prepareCustomerAddressInput({
            ...address,
            geocodingProvider: "Google_Places",
            // Tarayıcıdan gelen koordinat kullanılmamalı.
            latitude: 0,
            longitude: 0,
        }, {
            defaultLocationSource: "MANUAL_PIN",
            allowVerification: false,
            apiKey: "server-key",
            fetcher,
            now: () => new Date("2026-08-18T10:00:00.000Z"),
        })

        expect(fetcher).toHaveBeenCalledOnce()
        expect(result).toMatchObject({
            geocodingProvider: "google_places",
            latitude: 41.0082,
            longitude: 28.9784,
        })
    })

    it("aynı place ID hâlâ tazeyse Google'a hiç gitmez", async () => {
        const fetcher = vi.fn<typeof fetch>()
        const now = new Date("2026-08-18T10:00:00.000Z")
        const storedExpiry = new Date("2026-09-10T10:00:00.000Z")

        const result = await prepareCustomerAddressInput(address, {
            defaultLocationSource: "MANUAL_PIN",
            allowVerification: false,
            apiKey: "server-key",
            fetcher,
            now: () => now,
            existing: {
                geocodingProvider: "google_places",
                geocodingPlaceId: "old-place-id",
                geocodingExpiresAt: storedExpiry,
                latitude: "41.0082",
                longitude: "28.9784",
            },
        })

        expect(fetcher).not.toHaveBeenCalled()
        expect(result).toMatchObject({
            latitude: 41.0082,
            longitude: 28.9784,
            geocodingPlaceId: "old-place-id",
            // Depodaki bitiş tarihi uzatılmaz.
            geocodingExpiresAt: storedExpiry,
        })
    })

    it("kayıtlı koordinat cron yenileme penceresine girdiyse yeniden çözer", async () => {
        const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
            id: "old-place-id",
            location: { latitude: 41.1, longitude: 29.1 },
        }), { status: 200 }))

        await prepareCustomerAddressInput(address, {
            defaultLocationSource: "MANUAL_PIN",
            allowVerification: false,
            apiKey: "server-key",
            fetcher,
            now: () => new Date("2026-08-18T10:00:00.000Z"),
            existing: {
                geocodingProvider: "google_places",
                geocodingPlaceId: "old-place-id",
                // 7 günlük yenileme payının içinde.
                geocodingExpiresAt: new Date("2026-08-22T10:00:00.000Z"),
                latitude: 41.0082,
                longitude: 28.9784,
            },
        })

        expect(fetcher).toHaveBeenCalledOnce()
    })

    it("kalıcı 4xx'i 400, geçici hatayı 503 olarak bildirir", async () => {
        const options = {
            defaultLocationSource: "MANUAL_PIN",
            allowVerification: false,
            apiKey: "server-key",
        } as const

        await expect(prepareCustomerAddressInput(address, {
            ...options,
            fetcher: vi.fn<typeof fetch>().mockResolvedValue(
                new Response(JSON.stringify({ error: { status: "NOT_FOUND" } }), { status: 404 }),
            ),
        })).rejects.toMatchObject({ statusCode: 400 })

        await expect(prepareCustomerAddressInput(address, {
            ...options,
            fetcher: vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 429 })),
        })).rejects.toMatchObject({ statusCode: 503 })

        await expect(prepareCustomerAddressInput(address, {
            ...options,
            fetcher: vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 500 })),
        })).rejects.toMatchObject({ statusCode: 503 })
    })
})
