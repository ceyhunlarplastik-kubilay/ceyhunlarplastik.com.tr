import { describe, expect, it } from "vitest"
import { mapCustomerAddressForApi } from "@/core/helpers/crm/mapCustomerForApi"

describe("mapCustomerAddressForApi", () => {
    it("serializes Prisma Decimal-like coordinates as JSON numbers", () => {
        const result = mapCustomerAddressForApi({
            id: "address-1",
            latitude: { toNumber: () => 41.0082 },
            longitude: "28.9784",
            geocodingProvider: "google_places",
            geocodingExpiresAt: new Date(Date.now() + 60_000),
        })

        expect(result).toMatchObject({
            latitude: 41.0082,
            longitude: 28.9784,
            geocodingLabel: null,
            geocodingRaw: null,
        })
    })

    it("süresi geçmiş Google koordinatını yanıttan düşürür", () => {
        const result = mapCustomerAddressForApi({
            id: "address-1",
            latitude: 41.0082,
            longitude: 28.9784,
            geocodingProvider: "google_places",
            geocodingExpiresAt: new Date(Date.now() - 60_000),
        })

        expect(result).toMatchObject({ latitude: null, longitude: null })
    })

    it("sağlayıcı adının yazımı TTL kırpmasını atlatamaz", () => {
        const result = mapCustomerAddressForApi({
            id: "address-1",
            latitude: 41.0082,
            longitude: 28.9784,
            geocodingProvider: "Google_Places",
            geocodingExpiresAt: null,
        })

        expect(result).toMatchObject({ latitude: null, longitude: null })
    })

    it("Google dışı sağlayıcıda koordinatı olduğu gibi bırakır", () => {
        const result = mapCustomerAddressForApi({
            id: "address-1",
            latitude: 41.0082,
            longitude: 28.9784,
            geocodingProvider: null,
            geocodingExpiresAt: null,
        })

        expect(result).toMatchObject({ latitude: 41.0082, longitude: 28.9784 })
    })
})
