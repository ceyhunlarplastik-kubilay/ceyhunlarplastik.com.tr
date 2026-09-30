import { describe, expect, it } from "vitest"

import type { KanbanJob } from "@/features/production/kanban/api/types"
import { earliestDueDate, groupKanbanColumns, jobDelayMinutes, primaryOrder } from "./kanbanColumns"

const job = (id: string, overrides: Partial<KanbanJob> = {}): KanbanJob => ({
    id, lotBaseNumber: 1000, status: "PLANNED", version: 0, updatedAt: "2026-09-26T10:00:00.000Z",
    machine: { id: "m1", code: "M-01", name: "Arburg", area: { id: "a1", code: "P1", name: "Parkur 1" } },
    mold: { id: "k", code: "K-1001", name: "Kapak" },
    setupStartAt: "2026-09-28T05:00:00.000Z", productionStartAt: "2026-09-28T05:45:00.000Z", plannedEndAt: "2026-09-28T13:00:00.000Z",
    plannedShots: 100, colorHex: null, colorName: null, lotCount: 1, reportedLotCount: 0,
    outputs: [{ id: "o", cavities: 4, plannedQuantity: 400, goodQuantity: 0, scrapQuantity: 0, reportedGoodQuantity: 0, reportedScrapQuantity: 0, sizeCode: "10.1.3", productName: "Tapa",
        order: { id: "ord", orderNumber: "UE-1001", variantCode: "10.1.3.V1", quantity: 400, dueDate: "2026-10-05" } }],
    ...overrides,
})

const noFilter = { areaId: null, machineId: null, search: "" }

describe("groupKanbanColumns", () => {
    it("durum sütunları; planlı başlangıca göre, tamamlananlar en yeni üstte", () => {
        const columns = groupKanbanColumns([
            job("b", { setupStartAt: "2026-09-29T05:00:00.000Z" }),
            job("a"),
            job("c1", { status: "COMPLETED", updatedAt: "2026-09-25T10:00:00.000Z" }),
            job("c2", { status: "COMPLETED", updatedAt: "2026-09-26T10:00:00.000Z" }),
        ], noFilter)
        expect(columns.PLANNED.map((entry) => entry.id)).toEqual(["a", "b"])
        expect(columns.COMPLETED.map((entry) => entry.id)).toEqual(["c2", "c1"])
        expect(columns.RUNNING).toEqual([])
    })

    it("alan, makine ve arama süzgeci", () => {
        const jobs = [job("a"), job("b", { machine: { id: "m2", code: "M-02", name: "Engel", area: { id: "a2", code: "P2", name: "Parkur 2" } } })]
        expect(groupKanbanColumns(jobs, { ...noFilter, areaId: "a2" }).PLANNED.map((entry) => entry.id)).toEqual(["b"])
        expect(groupKanbanColumns(jobs, { ...noFilter, machineId: "m1" }).PLANNED.map((entry) => entry.id)).toEqual(["a"])
        expect(groupKanbanColumns(jobs, { ...noFilter, search: "ue-1001" }).PLANNED).toHaveLength(2)
        expect(groupKanbanColumns(jobs, { ...noFilter, search: "m-02" }).PLANNED.map((entry) => entry.id)).toEqual(["b"])
    })
})

describe("kart yardımcıları", () => {
    it("gecikme yalnız bitmemiş işte", () => {
        const now = new Date("2026-09-28T15:00:00.000Z")
        expect(jobDelayMinutes(job("a", { status: "RUNNING" }), now)).toBe(120)
        expect(jobDelayMinutes(job("a", { status: "COMPLETED" }), now)).toBeNull()
        expect(jobDelayMinutes(job("a"), new Date("2026-09-28T12:00:00.000Z"))).toBeNull()
    })

    it("en yakın termin ve başlık emri", () => {
        const withByProduct = job("a", { outputs: [{ ...job("x").outputs[0], order: null }, job("x").outputs[0]] })
        expect(earliestDueDate(withByProduct)).toBe("2026-10-05")
        expect(primaryOrder(withByProduct)?.orderNumber).toBe("UE-1001")
        expect(earliestDueDate(job("a", { outputs: [] }))).toBeNull()
    })
})
