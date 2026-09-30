import { describe, expect, it } from "vitest"

import {
    deriveShots,
    findLotReportIssues,
    findLotStartIssue,
    jobStatusAfterLotStart,
    jobStatusAfterReport,
    nextLotToStart,
    sumReportedOutputs,
    unreportedJobShots,
    type LotReportInput,
} from "./lotReports"

const at = (iso: string) => new Date(iso)
const reasons = [
    { id: "d-kalip", kind: "STOP" as const, isActive: true },
    { id: "d-eski", kind: "STOP" as const, isActive: false },
    { id: "f-capak", kind: "SCRAP" as const, isActive: true },
]
const report = (overrides: Partial<LotReportInput> = {}): LotReportInput => ({
    actualStartAt: at("2026-09-28T05:00:00Z"),
    actualEndAt: at("2026-09-28T13:00:00Z"),
    actualShots: null,
    outputs: [{ jobOutputId: "o1", goodQuantity: 3900, scrapQuantity: 100, scrapReasons: [{ reasonId: "f-capak", quantity: 60 }] }],
    stops: [{ reasonId: "d-kalip", durationMinutes: 45, startAt: at("2026-09-28T07:00:00Z") }],
    ...overrides,
})
const check = (value: LotReportInput, extra: Partial<Parameters<typeof findLotReportIssues>[0]> = {}) => findLotReportIssues({
    report: value, jobOutputIds: ["o1"], jobStatus: "RUNNING", reasons, keptReasonIds: [], now: at("2026-09-28T15:00:00Z"), ...extra,
})

describe("lot başlatma", () => {
    it("sahaya verilmiş iş, planlı lot, işte başka üretimde lot yok", () => {
        expect(findLotStartIssue({ jobStatus: "RELEASED", lotStatus: "PLANNED", runningLotNumber: null })).toBeNull()
        expect(findLotStartIssue({ jobStatus: "PLANNED", lotStatus: "PLANNED", runningLotNumber: null })).toContain("sahaya")
        expect(findLotStartIssue({ jobStatus: "COMPLETED", lotStatus: "PLANNED", runningLotNumber: null })).toContain("kapanmış")
        expect(findLotStartIssue({ jobStatus: "RUNNING", lotStatus: "RUNNING", runningLotNumber: null })).toContain("zaten")
        expect(findLotStartIssue({ jobStatus: "RUNNING", lotStatus: "PLANNED", runningLotNumber: "1000-1" })).toContain("1000-1")
    })

    it("iş durumu: başlatma duraklatılmışı da sürdürür; rapor duraklatılmışı değiştirmez", () => {
        expect(["RELEASED", "SETUP", "PAUSED", "RUNNING"].map((status) => jobStatusAfterLotStart(status as never))).toEqual(["RUNNING", "RUNNING", "RUNNING", "RUNNING"])
        expect(["RELEASED", "SETUP", "PAUSED", "RUNNING"].map((status) => jobStatusAfterReport(status as never))).toEqual(["RUNNING", "RUNNING", "PAUSED", "RUNNING"])
    })
})

describe("rapor kuralları", () => {
    it("geçerli rapor", () => {
        expect(check(report())).toEqual([])
    })

    it("süre, gelecek ve iş durumu", () => {
        expect(check(report({ actualEndAt: at("2026-09-28T04:00:00Z") })).map((issue) => issue.field)).toContain("actualEndAt")
        expect(check(report({ actualEndAt: at("2026-09-29T12:00:00Z") }), { now: at("2026-09-30T00:00:00Z") })[0].message).toContain("30 saati")
        expect(check(report({ actualEndAt: at("2026-09-28T16:00:00Z") })).map((issue) => issue.message)).toContain("Bitiş gelecekte olamaz.")
        expect(check(report(), { jobStatus: "PLANNED" })).toEqual([{ field: "job", message: expect.stringContaining("sahaya") }])
    })

    it("çıktılar: eksik, yabancı, bozuk adet; fire nedeni toplamı fireyi aşamaz", () => {
        expect(check(report({ outputs: [] })).map((issue) => issue.field)).toEqual(["outputs"])
        expect(check(report({ outputs: [{ jobOutputId: "x", goodQuantity: 1, scrapQuantity: 0, scrapReasons: [] }] })).map((issue) => issue.message))
            .toEqual(["Bu çıktı işe ait değil.", "Her çıktının sağlam ve fire adedi girilmeli."])
        const over = report({ outputs: [{ jobOutputId: "o1", goodQuantity: 1.5, scrapQuantity: 10, scrapReasons: [{ reasonId: "f-capak", quantity: 11 }] }] })
        expect(check(over).map((issue) => issue.field)).toEqual(["outputs.0.goodQuantity", "outputs.0.scrapQuantity"])
    })

    it("nedenler: tür, pasif (yeni) ve tekrar; mevcut raporda kalan pasif neden serbest", () => {
        const wrongKind = report({ outputs: [{ jobOutputId: "o1", goodQuantity: 1, scrapQuantity: 5, scrapReasons: [{ reasonId: "d-kalip", quantity: 2 }] }] })
        expect(check(wrongKind)[0].message).toBe("Fire nedeni bulunamadı.")
        const passive = report({ stops: [{ reasonId: "d-eski", durationMinutes: 10, startAt: null }] })
        expect(check(passive)[0].message).toContain("Pasif")
        expect(check(passive, { keptReasonIds: ["d-eski"] })).toEqual([])
        const twice = report({ outputs: [{ jobOutputId: "o1", goodQuantity: 1, scrapQuantity: 5, scrapReasons: [{ reasonId: "f-capak", quantity: 1 }, { reasonId: "f-capak", quantity: 1 }] }] })
        expect(check(twice)[0].message).toContain("iki kez")
    })

    it("duruşlar: süre, aralık ve toplam lot süresini aşamaz", () => {
        expect(check(report({ stops: [{ reasonId: "d-kalip", durationMinutes: 0, startAt: null }] }))[0].field).toBe("stops.0.durationMinutes")
        expect(check(report({ stops: [{ reasonId: "d-kalip", durationMinutes: 30, startAt: at("2026-09-28T12:45:00Z") }] }))[0].field).toBe("stops.0.startAt")
        expect(check(report({ stops: [{ reasonId: "d-kalip", durationMinutes: 481, startAt: null }] }))[0].message).toContain("aşamaz")
    })
})

describe("baskı ve sayaç", () => {
    const outputs = [{ goodQuantity: 3900, scrapQuantity: 101, cavities: 4 }, { goodQuantity: 10, scrapQuantity: 0, cavities: 0 }]

    it("girilen baskı öncelikli; yoksa adetlerden (gözü kapatılan çıktı hariç)", () => {
        expect(deriveShots({ actualShots: 1005, outputs })).toBe(1005)
        expect(deriveShots({ actualShots: null, outputs })).toBe(1001)
        expect(deriveShots({ actualShots: null, outputs: [] })).toBe(0)
    })

    it("raporsuz baskı tamamlamada eklenir, eksiye düşmez", () => {
        expect(unreportedJobShots({ outputs: [{ goodQuantity: 11_000, scrapQuantity: 200, cavities: 4 }], reportedShots: 1_000 })).toBe(1_800)
        expect(unreportedJobShots({ outputs: [{ goodQuantity: 100, scrapQuantity: 0, cavities: 4 }], reportedShots: 1_000 })).toBe(0)
    })
})

describe("lot akışı", () => {
    it("sıradaki planlı lot başlar; raporlanmış lotların toplamı", () => {
        const lots = [{ sequence: 1, status: "COMPLETED" as const }, { sequence: 2, status: "PLANNED" as const }, { sequence: 3, status: "PLANNED" as const }]
        expect(nextLotToStart(lots, 1)?.sequence).toBe(2)
        expect(nextLotToStart(lots, 3)).toBeNull()
        expect(nextLotToStart([{ sequence: 2, status: "RUNNING" as const }], 1)).toBeNull()

        const totals = sumReportedOutputs([
            { reported: true, outputs: [{ jobOutputId: "o1", goodQuantity: 3900, scrapQuantity: 100 }] },
            { reported: false, outputs: [{ jobOutputId: "o1", goodQuantity: 0, scrapQuantity: 0 }] },
            { reported: true, outputs: [{ jobOutputId: "o1", goodQuantity: 4000, scrapQuantity: 20 }] },
        ])
        expect(totals.get("o1")).toEqual({ goodQuantity: 7900, scrapQuantity: 120 })
    })
})
