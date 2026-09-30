import { describe, expect, it } from "vitest"

import { canReportLot, canStartLot, lotDisplayStatus, lotTotals } from "./lotExecution"

const lot = (status: string, jobStatus: string, reportedAt: string | null = null) => ({
    status, reportedAt, job: { status: jobStatus }, outputs: [{ goodQuantity: 10, scrapQuantity: 2 }, { goodQuantity: 5, scrapQuantity: 0 }],
}) as never

describe("lot yürütme görünümü", () => {
    it("raporsuz kapanan lot ayrı durum", () => {
        expect(lotDisplayStatus(lot("COMPLETED", "COMPLETED"))).toBe("CLOSED_UNREPORTED")
        expect(lotDisplayStatus(lot("COMPLETED", "RUNNING", "2026-01-05T13:00:00Z"))).toBe("REPORTED")
        expect(lotDisplayStatus(lot("RUNNING", "RUNNING"))).toBe("RUNNING")
    })

    it("başlatma / rapor düğmeleri: iş sahaya verilmiş ve kapanmamış", () => {
        expect(canStartLot(lot("PLANNED", "RELEASED"))).toBe(true)
        expect(canStartLot(lot("PLANNED", "PLANNED"))).toBe(false)
        expect(canStartLot(lot("RUNNING", "RUNNING"))).toBe(false)
        expect(canReportLot(lot("COMPLETED", "RUNNING", "x"))).toBe(true)
        expect(canReportLot(lot("RUNNING", "COMPLETED"))).toBe(false)
        expect(lotTotals(lot("RUNNING", "RUNNING"))).toEqual({ good: 15, scrap: 2 })
    })
})
