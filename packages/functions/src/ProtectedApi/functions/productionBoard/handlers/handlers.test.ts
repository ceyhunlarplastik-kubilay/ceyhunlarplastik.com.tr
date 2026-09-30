import { describe, expect, it, vi } from "vitest"

import { getProductionBoardHandler } from "./index"
import { addDaysToDateKey } from "@/core/helpers/production/productionCalendar"
import { productionDateKey } from "@/core/helpers/production/productionTime"
import type { IGetProductionBoardEvent } from "@/functions/ProtectedApi/types/productionBoard"

function buildDeps() {
    return {
        productionMachineRepository: { listMachines: vi.fn().mockResolvedValue([]) },
        productionAreaRepository: { listAreas: vi.fn().mockResolvedValue([]) },
        productionShiftPatternRepository: { listShiftPatterns: vi.fn().mockResolvedValue([]) },
        productionCalendarExceptionRepository: { listExceptions: vi.fn().mockResolvedValue([]) },
        productionMachineDowntimeRepository: { listDowntimes: vi.fn().mockResolvedValue([]) },
        productionJobRepository: { listBoardJobs: vi.fn().mockResolvedValue([]) },
        productionMoldRepository: { listMolds: vi.fn().mockResolvedValue([]) },
        productionOrderRepository: { listOrders: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }) },
    }
}

const event = (query?: Record<string, string>) => ({ queryStringParameters: query }) as unknown as IGetProductionBoardEvent

describe("getProductionBoardHandler", () => {
    it("pencere verilmezse bugün + 6 gün; sorgular fabrika saatindeki pencereyle yapılır", async () => {
        const deps = buildDeps()
        const response = await getProductionBoardHandler(deps as never)(event())
        const { range } = (response.body as unknown as { payload: { range: { from: string; to: string } } }).payload

        expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        // Tahmin pencere dışına taştığı için istisnalar geniş aralıkla okunur (31 gün geri, 47 gün ileri).
        const [exceptionRange] = deps.productionCalendarExceptionRepository.listExceptions.mock.calls[0]
        expect(exceptionRange.from < range.from).toBe(true)
        expect(exceptionRange.to > range.to).toBe(true)
        const [{ from, to }] = deps.productionJobRepository.listBoardJobs.mock.calls[0]
        expect((to.getTime() - from.getTime()) / 3_600_000).toBe(7 * 24)
    })

    it("belirli pencere: Türkiye gece yarısı UTC 21:00", async () => {
        const deps = buildDeps()
        await getProductionBoardHandler(deps as never)(event({ from: "2026-09-28", to: "2026-09-28" }))
        expect(deps.productionJobRepository.listBoardJobs).toHaveBeenCalledWith({
            from: new Date("2026-09-27T21:00:00.000Z"),
            to: new Date("2026-09-28T21:00:00.000Z"),
        })
    })

    it("uzak gelecek / geçmiş pencerede takvim yine BUGÜNÜ kapsar (üretimdeki işin tahmini şimdiden yürür)", async () => {
        const today = productionDateKey(new Date())
        const future = buildDeps()
        await getProductionBoardHandler(future as never)(event({ from: addDaysToDateKey(today, 120), to: addDaysToDateKey(today, 126) }))
        const [futureRange] = future.productionCalendarExceptionRepository.listExceptions.mock.calls[0]
        expect(futureRange.from <= addDaysToDateKey(today, -31)).toBe(true)
        const [futureDowntimes] = future.productionMachineDowntimeRepository.listDowntimes.mock.calls[0]
        expect(futureDowntimes.from.getTime()).toBeLessThan(Date.now())

        const past = buildDeps()
        await getProductionBoardHandler(past as never)(event({ from: addDaysToDateKey(today, -90), to: addDaysToDateKey(today, -84) }))
        const [pastRange] = past.productionCalendarExceptionRepository.listExceptions.mock.calls[0]
        expect(pastRange.to >= addDaysToDateKey(today, 45)).toBe(true)
        const [pastDowntimes] = past.productionMachineDowntimeRepository.listDowntimes.mock.calls[0]
        expect(pastDowntimes.to.getTime()).toBeGreaterThan(Date.now() + 45 * 86_400_000)
    })

    it("ters ya da çok uzun pencere 400", async () => {
        await expect(getProductionBoardHandler(buildDeps() as never)(event({ from: "2026-10-05", to: "2026-10-01" })))
            .rejects.toMatchObject({ statusCode: 400 })
        await expect(getProductionBoardHandler(buildDeps() as never)(event({ from: "2026-09-01", to: "2026-12-01" })))
            .rejects.toMatchObject({ statusCode: 400 })
    })
})
