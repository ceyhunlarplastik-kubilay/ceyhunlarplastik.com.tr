import { describe, expect, it } from "vitest"

import {
    buildProductionOrderPayload,
    createProductionOrderFormDefaults,
    productionOrderFormSchema,
} from "./productionOrderForm"

const VARIANT_ID = "22222222-2222-4222-8222-222222222222"

const validInput = (overrides: Record<string, unknown> = {}) => ({
    ...createProductionOrderFormDefaults(),
    productId: "p",
    productVariantId: VARIANT_ID,
    quantity: "100000",
    dueDate: "2026-10-15",
    ...overrides,
})

describe("productionOrderFormSchema", () => {
    it("metni sayıya çevirir; boş alanları null gönderir; arayüz alanlarını göndermez", () => {
        const payload = buildProductionOrderPayload(productionOrderFormSchema.parse(validInput({ dueDate: "" })))

        expect(payload).toEqual({
            productVariantId: VARIANT_ID,
            quantity: 100_000,
            dueDate: null,
            priority: "NORMAL",
            source: "MANUAL",
            customerId: null,
            cycleTimeOverrideSec: null,
            notes: null,
        })
    })

    it("müşteri siparişinde müşteri alanında hata verir (sunucuyla aynı kural)", () => {
        const result = productionOrderFormSchema.safeParse(validInput({ source: "CUSTOMER_ORDER" }))

        expect(result.success).toBe(false)
        expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(["customerId"])
    })

    it("varyant zorunlu; elle çevrim virgüllü yazılabilir", () => {
        expect(productionOrderFormSchema.safeParse(validInput({ productVariantId: "" })).success).toBe(false)
        const parsed = productionOrderFormSchema.parse(validInput({ cycleTimeOverrideSec: "17,5" }))
        expect(parsed.cycleTimeOverrideSec).toBe(17.5)
    })
})
