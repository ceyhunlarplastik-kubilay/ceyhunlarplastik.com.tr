import { describe, expect, it } from "vitest"

import type { LotDetail } from "@/features/production/lots/api/types"
import { lotReportFormDefaults, lotReportFormSchema, NO_OPERATOR, toFormPath, toLotReportInput } from "./lotReportForm"

const context = {
    jobOutputIds: ["o1"],
    jobStatus: "RUNNING" as const,
    reasons: [{ id: "d1", kind: "STOP" as const, isActive: true }, { id: "f1", kind: "SCRAP" as const, isActive: true }],
    keptReasonIds: [],
    now: new Date("2026-01-06T00:00:00Z"),
}

const lot = {
    plannedStartAt: "2026-01-05T05:00:00.000Z",
    plannedEndAt: "2026-01-05T13:00:00.000Z",
    actualStartAt: null,
    actualEndAt: null,
    actualShots: null,
    reportedAt: null,
    outputs: [{ jobOutputId: "o1", goodQuantity: 0, scrapQuantity: 0, scrapReasons: [] }],
    stops: [],
} as unknown as LotDetail

describe("lotReportForm", () => {
    it("yeni rapor: planlı saatler (fabrika saati), sağlam boş, fire 0", () => {
        expect(lotReportFormDefaults(lot)).toMatchObject({
            actualStartAt: "2026-01-05T08:00",
            actualEndAt: "2026-01-05T16:00",
            outputs: [{ jobOutputId: "o1", goodQuantity: "", scrapQuantity: "0", scrapReasons: [] }],
        })
        expect(lotReportFormSchema(context).safeParse(lotReportFormDefaults(lot)).success).toBe(false)
    })

    it("geçerli rapor ISO'ya çevrilir; devir notu opsiyonel operatörle", () => {
        const values = lotReportFormSchema(context).parse({
            ...lotReportFormDefaults(lot),
            actualShots: "1001",
            outputs: [{ jobOutputId: "o1", goodQuantity: "3900", scrapQuantity: "101", scrapReasons: [{ reasonId: "f1", quantity: "60" }] }],
            stops: [{ reasonId: "d1", durationMinutes: "45", startAt: "2026-01-05T10:00", note: " soğutma " }],
            handoverNote: " Kalıp ısınıyor ",
            handoverOperatorId: NO_OPERATOR,
        })
        expect(toLotReportInput(values, 7)).toEqual({
            actualStartAt: "2026-01-05T05:00:00.000Z",
            actualEndAt: "2026-01-05T13:00:00.000Z",
            actualShots: 1001,
            outputs: [{ jobOutputId: "o1", goodQuantity: 3900, scrapQuantity: 101, scrapReasons: [{ reasonId: "f1", quantity: 60 }] }],
            stops: [{ reasonId: "d1", durationMinutes: 45, startAt: "2026-01-05T07:00:00.000Z", note: "soğutma" }],
            handoverNote: { body: "Kalıp ısınıyor", operatorId: null },
            expectedVersion: 7,
        })
    })

    it("çekirdek kuralı forma bağlanır (fire kırılımı fireyi aşamaz → çıktının fire alanı)", () => {
        const result = lotReportFormSchema(context).safeParse({
            ...lotReportFormDefaults(lot),
            outputs: [{ jobOutputId: "o1", goodQuantity: "1", scrapQuantity: "5", scrapReasons: [{ reasonId: "f1", quantity: "6" }] }],
        })
        expect(result.success).toBe(false)
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain("outputs.0.scrapQuantity")
        expect(toFormPath("outputs.0.scrapReasons.1")).toEqual(["outputs", 0, "scrapReasons", 1, "reasonId"])
    })
})
