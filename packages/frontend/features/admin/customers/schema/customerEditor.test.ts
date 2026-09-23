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

describe("ek telefonlar", () => {
    const customer = {
        id: CUSTOMER_ID,
        fullName: null,
        phone: "0232 000 00 00",
        additionalPhones: [
            { id: "7c9d2e1f-3b4a-4c5d-8e6f-0a1b2c3d4e5f", number: "0532 444 55 66", label: null, displayOrder: 1 },
            { id: "2a4e1c0e-5a0b-4f0a-9f7e-6e1f1d2c3b4a", number: "0232 111 22 33", label: "Muhasebe", displayOrder: 0 },
        ],
        email: "",
        status: "LEAD" as const,
        createdAt: "2026-09-23T00:00:00.000Z",
        updatedAt: "2026-09-23T00:00:00.000Z",
    }

    it("mevcut ek numaraları forma yükler ve kayıtta TAMAMINI geri gönderir", () => {
        const result = customerEditorSchema.safeParse(createCustomerEditorDefaults(customer))

        expect(result.success).toBe(true)
        if (!result.success) return

        // API sırasıyla (displayOrder) gelir; form aynı sırayı korur.
        expect(buildCustomerUpdatePayload(CUSTOMER_ID, result.data).additionalPhones).toEqual([
            { number: "0532 444 55 66", label: null },
            { number: "0232 111 22 33", label: "Muhasebe" },
        ])
    })

    it("tüm satırlar silinirse boş liste gönderir (sunucuda da silinsin)", () => {
        const result = parse({ additionalPhones: [] })

        expect(result.success).toBe(true)
        if (!result.success) return

        expect(buildCustomerUpdatePayload(CUSTOMER_ID, result.data).additionalPhones).toEqual([])
    })

    it("birincil numaranın tekrarını ek satırda işaretler", () => {
        const result = parse({ additionalPhones: [{ number: "+90 232 000 00 00", label: "" }] })

        expect(result.success).toBe(false)
        if (result.success) return

        expect(result.error.issues.map((issue) => issue.path)).toEqual([["additionalPhones", 0, "number"]])
    })
})
