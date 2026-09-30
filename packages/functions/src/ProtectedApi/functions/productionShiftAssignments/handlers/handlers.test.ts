import { describe, expect, it, vi } from "vitest"

import { copyShiftAssignmentsHandler, replaceShiftAssignmentHandler } from "./index"
import type { ICopyShiftAssignmentsEvent, IReplaceShiftAssignmentEvent } from "@/functions/ProtectedApi/types/productionShiftAssignments"

const MON_SAT = [1, 2, 3, 4, 5, 6]
const machine = { id: "m1", code: "M-01", name: "Arburg", status: "ACTIVE", areaId: "a1", area: { id: "a1", code: "P1", name: "Parkur" }, shiftPatternId: null }
const pattern = {
    id: "p", name: "2×8", isDefault: true, timezone: "Europe/Istanbul",
    shifts: [
        { code: "A", name: "Sabah", startMinute: 480, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 0 },
        { code: "B", name: "Akşam", startMinute: 960, durationMinutes: 480, daysOfWeek: MON_SAT, sortOrder: 1 },
    ],
}
const ahmet = { id: "op-1", firstName: "Ahmet", lastName: "Yılmaz", employeeNo: null, isActive: true }
const veli = { id: "op-2", firstName: "Veli", lastName: "Kaya", employeeNo: null, isActive: false }

function buildDeps() {
    return {
        productionShiftAssignmentRepository: {
            listForDates: vi.fn().mockResolvedValue([
                { machineId: "m1", shiftDate: "2026-09-28", shiftCode: "A", operator: ahmet },
                { machineId: "m1", shiftDate: "2026-09-28", shiftCode: "B", operator: veli },
            ]),
            listForCells: vi.fn().mockResolvedValue([]),
            replaceCell: vi.fn(),
            replaceDays: vi.fn().mockResolvedValue(3),
        },
        productionMachineRepository: { listMachines: vi.fn().mockResolvedValue([machine]) },
        productionAreaRepository: { listAreas: vi.fn().mockResolvedValue([]) },
        productionShiftPatternRepository: { listShiftPatterns: vi.fn().mockResolvedValue([pattern]) },
        productionCalendarExceptionRepository: { listExceptions: vi.fn().mockResolvedValue([]) },
        productionOperatorRepository: { listOperators: vi.fn().mockResolvedValue([ahmet, veli]) },
    }
}

const replaceEvent = (body: Record<string, unknown>) => ({
    body: { machineId: "m1", shiftDate: "2026-09-28", shiftCode: "A", operatorIds: ["op-1"], ...body },
}) as unknown as IReplaceShiftAssignmentEvent

describe("replaceShiftAssignmentHandler", () => {
    it("çalışan hücre doldurulur; çalışılmayan hücre (Pazar / düzende olmayan kod) 409", async () => {
        const deps = buildDeps()
        await replaceShiftAssignmentHandler(deps as never)(replaceEvent({}))
        expect(deps.productionShiftAssignmentRepository.replaceCell).toHaveBeenCalledWith({ machineId: "m1", shiftDate: "2026-09-28", shiftCode: "A" }, ["op-1"])

        await expect(replaceShiftAssignmentHandler(deps as never)(replaceEvent({ shiftCode: "C" }))).rejects.toMatchObject({ statusCode: 409 })
        await expect(replaceShiftAssignmentHandler(deps as never)(replaceEvent({ shiftDate: "2026-09-27" }))).rejects.toMatchObject({ statusCode: 409 })
    })

    it("boşaltmak her zaman serbest (takvim okunmaz); yeni pasif operatör 400", async () => {
        const deps = buildDeps()
        await replaceShiftAssignmentHandler(deps as never)(replaceEvent({ shiftCode: "C", operatorIds: [] }))
        expect(deps.productionMachineRepository.listMachines).not.toHaveBeenCalled()
        expect(deps.productionShiftAssignmentRepository.replaceCell).toHaveBeenCalledWith(expect.objectContaining({ shiftCode: "C" }), [])

        await expect(replaceShiftAssignmentHandler(deps as never)(replaceEvent({ operatorIds: ["op-2"] }))).rejects.toMatchObject({ statusCode: 400 })
    })
})

describe("copyShiftAssignmentsHandler", () => {
    const copyEvent = (body: Record<string, unknown>) => ({ body: { fromDate: "2026-09-28", toStart: "2026-09-29", toEnd: "2026-10-04", ...body } }) as unknown as ICopyShiftAssignmentsEvent

    it("hedef günlere yazılır; Pazar atlanır, pasif operatör kopyalanmaz", async () => {
        const deps = buildDeps()
        const response = await copyShiftAssignmentsHandler(deps as never)(copyEvent({}))
        const [dates, rows] = deps.productionShiftAssignmentRepository.replaceDays.mock.calls[0]
        expect(dates).toHaveLength(6)
        // Salı–Cumartesi (5 gün) A vardiyası; Pazar (04.10) çalışılmıyor; Veli pasif.
        expect(rows.map((row: { shiftDate: string }) => row.shiftDate)).toEqual(["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"])
        expect(rows.every((row: { operatorId: string; shiftCode: string }) => row.operatorId === "op-1" && row.shiftCode === "A")).toBe(true)
        expect((response.body as unknown as { payload: unknown }).payload).toEqual({ days: 6, created: 3 })
    })

    it("geçersiz aralık 400", async () => {
        await expect(copyShiftAssignmentsHandler(buildDeps() as never)(copyEvent({ toStart: "2026-09-27", toEnd: "2026-09-29" })))
            .rejects.toMatchObject({ statusCode: 400 })
    })
})
