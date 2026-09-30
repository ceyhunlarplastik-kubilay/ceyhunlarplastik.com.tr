import { describe, expect, it } from "vitest"

import {
    allowedJobTransitions,
    canTransitionJob,
    deriveOrderStatusFromJobs,
    findJobCompletionIssues,
    KANBAN_JOB_STATUSES,
} from "./jobStateMachine"

describe("iş durum geçişleri", () => {
    it("ileri akış, geri çekme ve duraklatma", () => {
        expect(canTransitionJob("PLANNED", "RELEASED")).toBe(true)
        expect(canTransitionJob("RELEASED", "PLANNED")).toBe(true)
        expect(canTransitionJob("RELEASED", "SETUP")).toBe(true)
        expect(canTransitionJob("SETUP", "PAUSED")).toBe(true)
        expect(canTransitionJob("PAUSED", "RUNNING")).toBe(true)
        expect(canTransitionJob("RUNNING", "COMPLETED")).toBe(true)
    })

    it("atlama, geri dönüş ve kapanmış iş reddedilir", () => {
        expect(canTransitionJob("PLANNED", "RUNNING")).toBe(false)
        expect(canTransitionJob("RUNNING", "RELEASED")).toBe(false)
        expect(canTransitionJob("SETUP", "PLANNED")).toBe(false)
        expect(allowedJobTransitions("COMPLETED")).toEqual([])
        expect(canTransitionJob("PLANNED", "PLANNED")).toBe(false)
        expect(KANBAN_JOB_STATUSES).not.toContain("CANCELLED")
    })
})

describe("findJobCompletionIssues", () => {
    it("her çıktı için geçerli tam sayı", () => {
        expect(findJobCompletionIssues({
            jobOutputIds: ["a", "b"],
            outputs: [{ jobOutputId: "a", goodQuantity: 1000, scrapQuantity: 12 }, { jobOutputId: "b", goodQuantity: 0, scrapQuantity: 0 }],
        })).toEqual([])
    })

    it("eksik, yabancı, tekrar eden ve bozuk adet", () => {
        const issues = findJobCompletionIssues({
            jobOutputIds: ["a", "b"],
            outputs: [
                { jobOutputId: "a", goodQuantity: -1, scrapQuantity: 1.5 },
                { jobOutputId: "a", goodQuantity: 1, scrapQuantity: 0 },
                { jobOutputId: "x", goodQuantity: 1, scrapQuantity: 0 },
            ],
        })
        expect(issues.map((issue) => issue.message)).toEqual([
            expect.stringContaining("Sağlam"),
            expect.stringContaining("Fire"),
            "Aynı çıktı iki kez girilmiş.",
            "Bu çıktı işe ait değil.",
            expect.stringContaining("her çıktının"),
        ])
        expect(findJobCompletionIssues({ jobOutputIds: ["a"], outputs: undefined })).toHaveLength(1)
    })
})

describe("deriveOrderStatusFromJobs", () => {
    it("işlerden türer", () => {
        expect(deriveOrderStatusFromJobs("PLANNED", ["PLANNED"])).toBe("PLANNED")
        expect(deriveOrderStatusFromJobs("PLANNED", ["RELEASED"])).toBe("RELEASED")
        expect(deriveOrderStatusFromJobs("RELEASED", ["PLANNED"])).toBe("PLANNED")
        expect(deriveOrderStatusFromJobs("RELEASED", ["SETUP"])).toBe("IN_PROGRESS")
        expect(deriveOrderStatusFromJobs("IN_PROGRESS", ["COMPLETED", "PLANNED"])).toBe("IN_PROGRESS")
        expect(deriveOrderStatusFromJobs("IN_PROGRESS", ["COMPLETED", "CANCELLED"])).toBe("COMPLETED")
    })

    it("elle yönetilen durum ve işsiz emir değişmez", () => {
        expect(deriveOrderStatusFromJobs("ON_HOLD", ["RUNNING"])).toBeNull()
        expect(deriveOrderStatusFromJobs("CANCELLED", ["COMPLETED"])).toBeNull()
        expect(deriveOrderStatusFromJobs("PLANNED", [])).toBeNull()
    })
})
