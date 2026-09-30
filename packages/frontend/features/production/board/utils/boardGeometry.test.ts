import { describe, expect, it } from "vitest"

import type { BoardJob, BoardMachine } from "@/features/production/board/api/types"
import {
    boardDays,
    boardPixelsPerDay,
    boardWindow,
    draggedStartAt,
    groupMachinesByArea,
    isJobMovable,
    instantPercent,
    jobLabel,
    jobSegments,
    moveVerdict,
    offShiftSpans,
    orderDropVerdict,
    pointerStartAt,
    spanPercent,
    toSpan,
} from "./boardGeometry"

const range = toSpan("2026-09-27T21:00:00.000Z", "2026-09-28T21:00:00.000Z") // Pzt 28.09 (TR)

describe("pencere", () => {
    it("gün sayısı listede yoksa 7; iki uç dahil", () => {
        expect(boardWindow("2026-09-28", 7)).toEqual({ from: "2026-09-28", to: "2026-10-04" })
        expect(boardWindow("2026-09-28", 5)).toEqual({ from: "2026-09-28", to: "2026-10-04" })
        expect(boardPixelsPerDay(3)).toBeGreaterThan(boardPixelsPerDay(28))
    })

    it("gün sütunları fabrika gece yarısından başlar", () => {
        const [day] = boardDays("2026-09-28", "2026-09-28")
        expect(new Date(day.startMs).toISOString()).toBe("2026-09-27T21:00:00.000Z")
        expect(day).toMatchObject({ label: "28.09", weekday: "Pzt", isSunday: false })
        expect(boardDays("2026-09-27", "2026-09-27")[0].isSunday).toBe(true)
    })
})

describe("konum", () => {
    it("pencereye kırpar; dışarıdaysa null", () => {
        expect(spanPercent(range, toSpan("2026-09-28T03:00:00.000Z", "2026-09-28T09:00:00.000Z"))).toEqual({ left: 25, width: 25 })
        expect(spanPercent(range, toSpan("2026-09-27T09:00:00.000Z", "2026-09-28T03:00:00.000Z"))).toEqual({ left: 0, width: 25 })
        expect(spanPercent(range, toSpan("2026-09-29T00:00:00.000Z", "2026-09-29T03:00:00.000Z"))).toBeNull()
        expect(instantPercent(range, "2026-09-28T09:00:00.000Z")).toBe(50)
        expect(instantPercent(range, "2026-09-30T09:00:00.000Z")).toBeNull()
    })

    it("vardiya dışı boşluklar", () => {
        const gaps = offShiftSpans(range, [
            { workday: "2026-09-28", shiftCode: "A", shiftName: "", startAt: "2026-09-28T05:00:00.000Z", endAt: "2026-09-28T13:00:00.000Z" },
            { workday: "2026-09-28", shiftCode: "B", shiftName: "", startAt: "2026-09-28T13:00:00.000Z", endAt: "2026-09-28T17:00:00.000Z" },
        ])
        expect(gaps.map((gap) => [new Date(gap.startMs).toISOString(), new Date(gap.endMs).toISOString()])).toEqual([
            ["2026-09-27T21:00:00.000Z", "2026-09-28T05:00:00.000Z"],
            ["2026-09-28T17:00:00.000Z", "2026-09-28T21:00:00.000Z"],
        ])
        expect(offShiftSpans(range, [])).toEqual([range])
    })
})

const job: BoardJob = {
    id: "j",
    lotBaseNumber: 1000,
    status: "PLANNED",
    version: 0,
    machineId: "m1",
    mold: { id: "k", code: "K-1001", name: "Kalıp", totalShots: 0, maintenanceIntervalShots: null, shotsAtLastMaintenance: 0 },
    setupStartAt: "2026-09-28T05:00:00.000Z",
    productionStartAt: "2026-09-28T05:45:00.000Z",
    plannedEndAt: "2026-09-28T13:00:00.000Z",
    plannedShots: 100,
    cycleTimeSec: 20,
    efficiencyPercent: 85,
    setupMinutes: 45,
    forecast: { state: "ON_TRACK", progress: 0, reportedShots: 0, remainingShots: 100, projectedEndAt: "2026-09-28T13:00:00.000Z", delayMinutes: 0, dueRisk: false },
    moldMaintenance: { level: "NONE", projectedLevel: "NONE", shotsSinceMaintenance: 0, intervalShots: null, remainingShots: null, ratio: null },
    colorHex: null,
    colorName: null,
    outputs: [{ productSizeId: "s", cavities: 4, plannedQuantity: 400, order: { id: "o", orderNumber: "UE-1001", variantCode: "10.1.3.V1", quantity: 400, dueDate: null } }],
    lots: [{
        lotNumber: "1000-1", sequence: 1, shiftDate: "2026-09-28", shiftCode: "A", plannedStartAt: "2026-09-28T05:45:00.000Z", plannedEndAt: "2026-09-28T13:00:00.000Z", plannedShots: 100,
        status: "PLANNED", actualStartAt: null, actualEndAt: null, actualShots: null, reported: false,
    }],
    machineFit: [
        { machineId: "m1", verdict: "ok", reason: null },
        { machineId: "m2", verdict: "warning", reason: null },
        { machineId: "m3", verdict: "error", reason: "Kapama kuvveti: yetmez" },
    ],
}

describe("iş", () => {
    it("bağlama + lot parçaları ve etiket", () => {
        expect(jobSegments(job).map((segment) => segment.kind)).toEqual(["setup", "lot"])
        expect(jobSegments({ ...job, productionStartAt: job.setupStartAt }).map((segment) => segment.kind)).toEqual(["lot"])
        expect(jobLabel(job)).toBe("1000 · UE-1001 · 10.1.3.V1")
        expect(jobLabel({ ...job, outputs: [{ ...job.outputs[0], order: null }] })).toBe("1000 · K-1001")
    })
})

describe("groupMachinesByArea", () => {
    const machine = (id: string, areaId: string): BoardMachine => ({
        id, code: id, name: id, status: "ACTIVE", area: { id: areaId, code: areaId, name: areaId },
        shiftPatternName: null, shifts: [], dayExceptions: [],
    })

    it("sırayı korur ve alanla süzer", () => {
        const machines = [machine("m1", "a"), machine("m2", "a"), machine("m3", "b")]
        expect(groupMachinesByArea(machines).map((group) => [group.area.id, group.machines.length])).toEqual([["a", 2], ["b", 1]])
        expect(groupMachinesByArea(machines, "b").map((group) => group.area.id)).toEqual(["b"])
    })
})

describe("sürükle-bırak", () => {
    it("yatay mesafe → 15 dk'ya yuvarlı yeni başlangıç", () => {
        // 24 saatlik pencere 960 px → 1 px = 90 sn; +100 px = 150 dk; +7 px = 10,5 dk → 15 dk.
        const base = { setupStartAt: job.setupStartAt, timelineWidthPx: 960, range }
        expect(draggedStartAt({ ...base, deltaXPx: 100 }).toISOString()).toBe("2026-09-28T07:30:00.000Z")
        expect(draggedStartAt({ ...base, deltaXPx: 7 }).toISOString()).toBe("2026-09-28T05:15:00.000Z")
        expect(draggedStartAt({ ...base, deltaXPx: -40 }).toISOString()).toBe("2026-09-28T04:00:00.000Z")
    })

    it("hedef satır hükmü ve yalnız planlı iş taşınır", () => {
        expect(moveVerdict(job, "m1").verdict).toBe("same")
        expect(moveVerdict(job, "m2").verdict).toBe("warning")
        expect(moveVerdict(job, "m3")).toEqual({ verdict: "error", reason: "Kapama kuvveti: yetmez" })
        expect(moveVerdict(job, "m9").verdict).toBe("unknown")
        expect(isJobMovable(job)).toBe(true)
        expect(isJobMovable({ ...job, status: "RUNNING" })).toBe(false)
    })
})

describe("bekleyen emir kartı", () => {
    it("imleç konumu → 15 dk'ya yuvarlı başlangıç; satır dışına taşarsa pencereye kıstırılır", () => {
        // 24 saatlik pencere, satır 100–1060 px: ortası = 12 saat sonra.
        const base = { rectLeft: 100, rectWidth: 960, range }
        expect(pointerStartAt({ ...base, clientX: 580 }).toISOString()).toBe("2026-09-28T09:00:00.000Z")
        expect(pointerStartAt({ ...base, clientX: 50 }).toISOString()).toBe("2026-09-27T21:00:00.000Z")
    })

    it("makine hükmü emrin en uygun kalıbından", () => {
        const order = {
            id: "o", orderNumber: 1005, status: "DRAFT", variantCode: "10.1.3.V1", productName: "Tapa", sizeLabel: "", quantity: 1000,
            dueDate: null, priority: "NORMAL", colorHex: null, colorName: null,
            machineFit: [{ machineId: "m1", verdict: "ok" }, { machineId: "m2", verdict: "error" }],
        } as const
        expect(orderDropVerdict({ ...order, machineFit: [...order.machineFit] }, "m1").verdict).toBe("ok")
        expect(orderDropVerdict({ ...order, machineFit: [...order.machineFit] }, "m2").verdict).toBe("error")
    })
})
