import { describe, expect, it } from "vitest"

import { jobCompletionDefaults, jobCompletionFormSchema, toCompletionInput } from "./jobCompletionForm"

describe("jobCompletionForm", () => {
    const job = {
        version: 3,
        reportedLotCount: 0,
        outputs: [
            {
                id: "a", cavities: 4, plannedQuantity: 10_000, goodQuantity: 0, scrapQuantity: 0,
                reportedGoodQuantity: 7_800, reportedScrapQuantity: 150, sizeCode: "1.3.8", productName: "Tapa", order: null,
            },
        ],
    }

    it("varsayılan planlanan adet; sayıya çevrilip gider", () => {
        const defaults = jobCompletionDefaults(job)
        expect(defaults).toEqual({ outputs: [{ jobOutputId: "a", goodQuantity: "10000", scrapQuantity: "0" }] })
        const parsed = jobCompletionFormSchema.parse({ outputs: [{ jobOutputId: "a", goodQuantity: "9800", scrapQuantity: "140" }] })
        expect(toCompletionInput(parsed, job)).toEqual({
            status: "COMPLETED",
            expectedVersion: 3,
            outputs: [{ jobOutputId: "a", goodQuantity: 9800, scrapQuantity: 140 }],
        })
    })

    it("lot raporu varsa öneri raporların toplamı", () => {
        expect(jobCompletionDefaults({ ...job, reportedLotCount: 2 })).toEqual({ outputs: [{ jobOutputId: "a", goodQuantity: "7800", scrapQuantity: "150" }] })
    })

    it("boş, ondalık ve negatif reddedilir", () => {
        for (const value of ["", "12,5", "-3"]) {
            expect(jobCompletionFormSchema.safeParse({ outputs: [{ jobOutputId: "a", goodQuantity: value, scrapQuantity: "0" }] }).success).toBe(false)
        }
    })
})
