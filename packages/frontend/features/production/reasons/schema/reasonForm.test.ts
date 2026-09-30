import { describe, expect, it } from "vitest"

import { reasonFormDefaults, reasonFormSchema, toReasonInput } from "./reasonForm"

describe("reasonForm", () => {
    it("duruş: kategori zorunlu, kod normalleşir", () => {
        const schema = reasonFormSchema("STOP")
        const values = schema.parse({ ...reasonFormDefaults("STOP", null, 12), code: " d13 ", name: " Kalıp temizliği " })
        expect(toReasonInput("STOP", values)).toEqual({ kind: "STOP", code: "D13", name: "Kalıp temizliği", stopCategory: "BREAKDOWN", isActive: true, sortOrder: 12 })
        expect(schema.safeParse({ ...reasonFormDefaults("STOP", null, 0), code: "D1", name: "x", stopCategory: "" }).success).toBe(false)
    })

    it("fire: kategorisiz; bozuk kod reddedilir", () => {
        const schema = reasonFormSchema("SCRAP")
        const values = schema.parse({ ...reasonFormDefaults("SCRAP", null, 0), code: "F11", name: "Hava kabarcığı" })
        expect(toReasonInput("SCRAP", values).stopCategory).toBeNull()
        expect(schema.safeParse({ ...reasonFormDefaults("SCRAP", null, 0), code: "Ç 1", name: "x" }).success).toBe(false)
    })
})
