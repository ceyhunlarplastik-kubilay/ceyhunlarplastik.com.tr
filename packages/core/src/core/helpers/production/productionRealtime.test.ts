import { describe, expect, it } from "vitest"

import { buildProductionChangeMessage, parseProductionChangeMessage } from "./productionRealtime"

describe("üretim canlı güncelleme mesajı", () => {
    it("kurulan mesaj ayrıştırılınca aynen döner; alanlar tekilleşir", () => {
        const message = buildProductionChangeMessage({
            scopes: ["plan", "plan", "lots"],
            actorUserId: "u-1",
            occurredAt: new Date("2026-09-28T11:00:00.000Z"),
        })
        expect(message).toEqual({ type: "production.changed", scopes: ["plan", "lots"], occurredAt: "2026-09-28T11:00:00.000Z", actorUserId: "u-1" })
        expect(parseProductionChangeMessage(JSON.stringify(message))).toEqual(message)
    })

    it("bilinmeyen alan düşer; tanınan alan yoksa, tür ya da zaman bozuksa null", () => {
        const base = { type: "production.changed", occurredAt: "2026-09-28T11:00:00.000Z", actorUserId: null }
        expect(parseProductionChangeMessage(JSON.stringify({ ...base, scopes: ["plan", "future-scope"] }))?.scopes).toEqual(["plan"])
        expect(parseProductionChangeMessage(JSON.stringify({ ...base, scopes: ["future-scope"] }))).toBeNull()
        expect(parseProductionChangeMessage(JSON.stringify({ ...base, type: "other", scopes: ["plan"] }))).toBeNull()
        expect(parseProductionChangeMessage(JSON.stringify({ ...base, occurredAt: "dün", scopes: ["plan"] }))).toBeNull()
        expect(parseProductionChangeMessage("{bozuk")).toBeNull()
        expect(parseProductionChangeMessage(JSON.stringify({ ...base, scopes: ["roster"], actorUserId: 42 }))?.actorUserId).toBeNull()
    })
})
