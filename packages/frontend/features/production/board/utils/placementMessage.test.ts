import { describe, expect, it } from "vitest"

import { describePlacementResult, describePushFollowersResult, placementModeFromParam } from "./placementMessage"

describe("placementMessage", () => {
    it("kip URL'den", () => {
        expect(placementModeFromParam("kaydir")).toBe("push-later")
        expect(placementModeFromParam(null)).toBe("first-gap")
        expect(placementModeFromParam("x")).toBe("first-gap")
    })

    it("bildirim metni", () => {
        const base = { subject: "İş 1003", verb: "taşındı", target: "M-02 · 29.09 08:15", shifted: false, shiftedJobs: [] }
        expect(describePlacementResult(base)).toBe("İş 1003 taşındı: M-02 · 29.09 08:15")
        expect(describePlacementResult({ ...base, shifted: true })).toBe("İş 1003 ilk uygun boşluğa yerleşti: M-02 · 29.09 08:15")
        expect(describePlacementResult({
            ...base,
            shiftedJobs: [
                { id: "a", lotBaseNumber: 1004, fromStartAt: "", toStartAt: "" },
                { id: "b", lotBaseNumber: 1005, fromStartAt: "", toStartAt: "" },
            ],
        })).toBe("İş 1003 taşındı: M-02 · 29.09 08:15 · 2 iş kaydırıldı (1004, 1005)")
    })

    it("gecikme önerisi sonucu (fabrika saatiyle)", () => {
        const result = { projectedEndAt: "2026-09-29T11:30:00.000Z", delayMinutes: 90, shiftedJobs: [] }
        expect(describePushFollowersResult(1000, result)).toBe("İş 1000 · tahmini bitiş 29.09 14:30 · sonraki işler zaten bu anın arkasında; kaydırma gerekmedi")
        expect(describePushFollowersResult(1000, {
            ...result,
            shiftedJobs: [{ id: "a", lotBaseNumber: 1001, fromStartAt: "", toStartAt: "" }, { id: "b", lotBaseNumber: 1002, fromStartAt: "", toStartAt: "" }],
        })).toBe("İş 1000 · tahmini bitiş 29.09 14:30 · 2 iş kaydırıldı (1001, 1002)")
    })
})
