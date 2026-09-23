import { describe, expect, it } from "vitest"

import {
    buildCustomerUpdatePayload,
    createCustomerEditorDefaults,
    customerEditorSchema,
} from "./customerEditor"

const CUSTOMER_ID = "0f6f7c44-8a0e-4d59-9d0b-6a0a3d1f2b10"

function parse(overrides: Record<string, unknown> = {}) {
    return customerEditorSchema.safeParse({
        ...createCustomerEditorDefaults(),
        phone: "0232 000 00 00",
        ...overrides,
    })
}

describe("customerEditorSchema", () => {
    // Veri girişi potansiyel müşteriyi yetkili adı ve e-posta OLMADAN kaydediyor;
    // bu dialog o kayıtları kaydedebilmeli (eskiden ikisi de zorunluydu).
    it("yetkili adı ve e-postası boş kaydı kabul eder", () => {
        const result = parse({ fullName: "   ", email: "" })

        expect(result.success).toBe(true)
        if (!result.success) return

        const payload = buildCustomerUpdatePayload(CUSTOMER_ID, result.data)
        // Yetkili nullable → null; e-posta NOT NULL → "" (veri girişiyle aynı temsil).
        expect(payload.fullName).toBeNull()
        expect(payload.email).toBe("")
    })

    it("dolu ama tek karakterlik yetkili adını reddeder (sunucu min 2 bekliyor)", () => {
        expect(parse({ fullName: "A" }).success).toBe(false)
        expect(parse({ fullName: "Ali" }).success).toBe(true)
    })

    it("dolu e-postanın biçimini yine doğrular", () => {
        expect(parse({ email: "gecersiz-adres" }).success).toBe(false)
        expect(parse({ email: "info@acme.com" }).success).toBe(true)
    })
})

describe("buildCustomerUpdatePayload", () => {
    it("sektör/üretim grubu/kullanım alanlarını attributeValueIds'e tekrarsız birleştirir", () => {
        const result = parse({
            attributeValueIds: ["generic-1"],
            sectorValueId: "sector-1",
            productionGroupValueId: "group-1",
            // Farklı sektörlerden kullanım alanı meşru; tekrar eden id tek kez yazılır.
            usageAreaValueIds: ["usage-1", "usage-2", "usage-1"],
        })

        expect(result.success).toBe(true)
        if (!result.success) return

        const payload = buildCustomerUpdatePayload(CUSTOMER_ID, result.data)
        expect(payload.attributeValueIds).toEqual(["generic-1", "sector-1", "group-1", "usage-1", "usage-2"])
        expect(payload.sectorValueId).toBe("sector-1")
        expect(payload.productionGroupValueId).toBe("group-1")
    })
})
