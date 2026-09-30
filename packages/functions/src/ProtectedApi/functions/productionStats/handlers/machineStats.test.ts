import { describe, expect, it, vi } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import type { ProductionAreaDto } from "@/core/helpers/prisma/productionAreas/repository"
import type { CalendarExceptionDto } from "@/core/helpers/prisma/productionCalendarExceptions/repository"
import type { MachineDowntimeDto } from "@/core/helpers/prisma/productionMachineDowntimes/repository"
import type { ProductionMachineDto } from "@/core/helpers/prisma/productionMachines/repository"
import type { ShiftPatternDto } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import type { MachineStatsLotInput, UnreportedLotCandidate } from "@/core/helpers/production/machineStats"
import { productionDateKey } from "@/core/helpers/production/productionTime"
import { machineStatsResponseValidator } from "@/functions/ProtectedApi/validators/productionStats"
import type { IGetMachineStatsEvent } from "@/functions/ProtectedApi/types/productionStats"
import { getMachineStatsHandler } from "./machineStats"

const AREA_ID = "11111111-1111-4111-8111-111111111111"
const EMPTY_AREA_ID = "11111111-1111-4111-8111-111111111112"
const MACHINE_ID = "22222222-2222-4222-8222-222222222222"
const OTHER_MACHINE_ID = "22222222-2222-4222-8222-222222222223"
const REASON_ID = "33333333-3333-4333-8333-333333333333"
const at = (iso: string) => new Date(iso)

// DTO tipleriyle yazılı fixture'lar: repository dönüşü değişirse burası derlenmez (şema kayması).
const area = (id: string, code: string, machineCount: number): ProductionAreaDto => ({
    id, code, name: `Alan ${code}`, sortOrder: 0, isActive: true, notes: null, shiftPatternId: null, shiftPattern: null,
    createdAt: at("2026-01-01T00:00:00Z"), updatedAt: at("2026-01-01T00:00:00Z"), machineCount,
})
const machine = (id: string, code: string, areaId: string): ProductionMachineDto => ({
    id, code, name: `Makine ${code}`, brand: null, model: null, serialNumber: null, manufactureYear: null,
    areaId, area: { id: areaId, code: "P1", name: "Alan P1" }, status: "ACTIVE", clampForceTon: 150,
    tieBarHorizontalMm: null, tieBarVerticalMm: null, minMoldHeightMm: null, maxMoldHeightMm: null, maxOpeningStrokeMm: null,
    maxDaylightMm: null, shotCapacityG: null, screwDiameterMm: null, locatingRingDiameterMm: null, hotRunnerZones: 0, coreCircuits: 0,
    hasRobot: false, plannedEfficiencyPercent: 85, hourlyCost: null, currency: "TRY", shiftPatternId: null, shiftPattern: null,
    sortOrder: 0, notes: null, createdAt: at("2026-01-01T00:00:00Z"), updatedAt: at("2026-01-01T00:00:00Z"),
})
const pattern: ShiftPatternDto = {
    id: "44444444-4444-4444-8444-444444444444", name: "1×8", isDefault: true, timezone: "Europe/Istanbul", notes: null,
    createdAt: at("2026-01-01T00:00:00Z"), updatedAt: at("2026-01-01T00:00:00Z"),
    shifts: [{ id: "s-a", code: "A", name: "Gündüz", startMinute: 480, durationMinutes: 480, daysOfWeek: [1, 2, 3, 4, 5, 6], sortOrder: 0 }],
    machineCount: 0, areaCount: 0,
}
const exceptions: CalendarExceptionDto[] = []
const downtimes: MachineDowntimeDto[] = [{
    id: "55555555-5555-4555-8555-555555555555", machineId: MACHINE_ID, machine: { id: MACHINE_ID, code: "M-01", name: "Makine M-01" },
    // Sal 13:00–14:00 (TR) planlı bakım.
    startAt: at("2026-09-01T10:00:00Z"), endAt: at("2026-09-01T11:00:00Z"), kind: "PLANNED_MAINTENANCE", reason: null,
    createdByUserId: null, createdByUser: null, createdAt: at("2026-09-01T00:00:00Z"), updatedAt: at("2026-09-01T00:00:00Z"),
}]
const lots: MachineStatsLotInput[] = [{
    // Sal 08:00–12:00 (TR): 240 dk, 30 dk arıza; 600 baskı × 20 sn = 200 dk ideal.
    machineId: MACHINE_ID, actualStartAt: at("2026-09-01T05:00:00Z"), actualEndAt: at("2026-09-01T09:00:00Z"), actualShots: 600, cycleTimeSec: 20,
    stops: [{ minutes: 30, category: "BREAKDOWN", reasonId: REASON_ID, reasonCode: "D01", reasonName: "Kalıp arızası" }],
    goodQuantity: 1_180, scrapQuantity: 20,
}]
const unreportedLots: UnreportedLotCandidate[] = [
    { machineId: OTHER_MACHINE_ID, plannedStartAt: at("2026-09-01T05:00:00Z"), actualStartAt: null, jobCompletedAt: at("2026-09-01T20:00:00Z") },
]

function buildDeps() {
    return {
        productionMachineRepository: { listMachines: vi.fn().mockResolvedValue([machine(MACHINE_ID, "M-01", AREA_ID), machine(OTHER_MACHINE_ID, "M-02", AREA_ID)]) },
        productionAreaRepository: { listAreas: vi.fn().mockResolvedValue([area(AREA_ID, "P1", 2), area(EMPTY_AREA_ID, "P2", 0)]) },
        productionShiftPatternRepository: { listShiftPatterns: vi.fn().mockResolvedValue([pattern]) },
        productionCalendarExceptionRepository: { listExceptions: vi.fn().mockResolvedValue(exceptions) },
        productionMachineDowntimeRepository: { listDowntimes: vi.fn().mockResolvedValue(downtimes) },
        productionStatsRepository: {
            listMachineReportedLots: vi.fn().mockResolvedValue(lots),
            listMachineUnreportedLots: vi.fn().mockResolvedValue(unreportedLots),
        },
    }
}

const event = (query?: Record<string, string>) => ({ queryStringParameters: query }) as unknown as IGetMachineStatsEvent

type Payload = {
    range: { from: string; to: string; startAt: string; endAt: string }
    areas: Array<{ id: string }>
    rows: Array<{ machineId: string; time: { capacityMinutes: number; idleMinutes: number; downtimeMinutes: { PLANNED_MAINTENANCE: number } }; report: { unreportedLotCount: number }; oee: number | null; availability: number | null }>
    stopReasons: Array<{ code: string; minutes: number }>
}

describe("getMachineStatsHandler", () => {
    it("belirli pencere: hesap + GERÇEK çıktı yanıt şemasına uyar; süzgeç seçenekleri makinesi olan alanlar", async () => {
        const deps = buildDeps()
        const response = await getMachineStatsHandler(deps)(event({ from: "2026-09-01", to: "2026-09-01" }))

        const validate = transpileSchema(machineStatsResponseValidator) as unknown as ValidateFunction
        expect(validate(JSON.parse(JSON.stringify(response)))).toBe(true)
        expect(validate.errors ?? []).toEqual([])

        const payload = (response.body as unknown as { payload: Payload }).payload
        expect(payload.range).toMatchObject({ from: "2026-09-01", to: "2026-09-01", startAt: "2026-08-31T21:00:00.000Z", endAt: "2026-09-01T21:00:00.000Z" })
        expect(payload.areas.map((entry) => entry.id)).toEqual([AREA_ID])
        const [m1, m2] = payload.rows
        expect(m1).toMatchObject({ machineId: MACHINE_ID, time: { capacityMinutes: 480, idleMinutes: 180, downtimeMinutes: { PLANNED_MAINTENANCE: 60 } } })
        expect(m1.availability).toBeCloseTo(210 / 240)
        expect(m1.oee).toBeCloseTo((210 / 240) * (200 / 210) * (1_180 / 1_200))
        expect(m2).toMatchObject({ machineId: OTHER_MACHINE_ID, oee: null, report: { unreportedLotCount: 1 } })
        expect(payload.stopReasons).toEqual([expect.objectContaining({ code: "D01", minutes: 30 })])

        // Önceki günün gece vardiyası pencereye taşabilir: istisnalar bir gün önceden.
        expect(deps.productionCalendarExceptionRepository.listExceptions).toHaveBeenCalledWith({ from: "2026-08-31", to: "2026-09-01" })
        expect(deps.productionStatsRepository.listMachineReportedLots).toHaveBeenCalledWith({
            from: at("2026-08-31T21:00:00Z"), to: at("2026-09-01T21:00:00Z"), areaId: undefined,
        })
    })

    it("varsayılan son 30 gün; pencere ŞİMDİ'de biter (gelmemiş vardiya boş sayılmaz)", async () => {
        const deps = buildDeps()
        const before = Date.now()
        const response = await getMachineStatsHandler(deps)(event())
        const { range } = (response.body as unknown as { payload: Payload }).payload
        expect(range.to).toBe(productionDateKey(new Date()))
        const [{ from, to }] = deps.productionStatsRepository.listMachineReportedLots.mock.calls[0]
        expect(to.getTime()).toBeGreaterThanOrEqual(before)
        expect(to.getTime()).toBeLessThanOrEqual(Date.now())
        expect((to.getTime() - from.getTime()) / 86_400_000).toBeLessThanOrEqual(30)
        expect((to.getTime() - from.getTime()) / 86_400_000).toBeGreaterThan(29)
    })

    it("alan süzgeci: yalnız o alanın makineleri, sorgular alanla; bilinmeyen alan ve bozuk pencere 400", async () => {
        const deps = buildDeps()
        deps.productionMachineRepository.listMachines.mockResolvedValue([machine(MACHINE_ID, "M-01", AREA_ID), machine(OTHER_MACHINE_ID, "M-02", EMPTY_AREA_ID)])
        const response = await getMachineStatsHandler(deps)(event({ from: "2026-09-01", to: "2026-09-01", areaId: AREA_ID }))
        expect((response.body as unknown as { payload: Payload }).payload.rows.map((row) => row.machineId)).toEqual([MACHINE_ID])
        expect(deps.productionStatsRepository.listMachineUnreportedLots).toHaveBeenCalledWith(expect.objectContaining({ areaId: AREA_ID }))

        await expect(getMachineStatsHandler(buildDeps())(event({ areaId: "99999999-9999-4999-8999-999999999999" }))).rejects.toMatchObject({ statusCode: 400 })
        await expect(getMachineStatsHandler(buildDeps())(event({ from: "2025-01-01", to: "2026-09-01" }))).rejects.toMatchObject({ statusCode: 400 })
    })
})
