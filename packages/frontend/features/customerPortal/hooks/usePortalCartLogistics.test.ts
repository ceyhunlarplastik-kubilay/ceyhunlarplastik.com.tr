import { describe, expect, it } from "vitest"

import {
    PORTAL_CART_LOGISTICS_STALE_TIME_MS,
    portalCartLogisticsQueryKey,
} from "./usePortalCartLogistics"

const A = "11111111-1111-4111-8111-111111111111"
const B = "22222222-2222-4222-8222-222222222222"

describe("portal cart logistics query contract", () => {
    it("query key içinde yalnız sıralı ve tekil varyant kimliklerini tutar", () => {
        expect(portalCartLogisticsQueryKey([B, A, B])).toEqual([
            "customer-portal",
            "cart-logistics",
            [A, B],
        ])
    })

    it("profil önbelleğini beş dakika taze tutar", () => {
        expect(PORTAL_CART_LOGISTICS_STALE_TIME_MS).toBe(300_000)
    })
})
