import createError from "http-errors"

import { evaluateMoldMachineCompatibility } from "@/core/helpers/production/moldMachineCompatibility"
import { addDaysToDateKey } from "@/core/helpers/production/productionCalendar"
import {
    bestCompatibilityVerdict,
    boardRangeInstants,
    buildBoardMachineCalendars,
    DEFAULT_BOARD_DAYS,
    findBoardRangeIssue,
} from "@/core/helpers/production/productionBoard"
import { productionDateKey } from "@/core/helpers/production/productionTime"
import { forecastCalendarRange, forecastJobsOnMachines, remainingShotsByMold } from "@/core/helpers/production/jobForecast"
import { moldMaintenanceStatus } from "@/core/helpers/production/moldMaintenance"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type { IGetProductionBoardEvent, IProductionBoardDependencies } from "@/functions/ProtectedApi/types/productionBoard"

/** Tahtadaki bekleyen emirler paneli en çok bu kadar kart gösterir (termine göre sıralı). */
export const BOARD_PENDING_ORDER_LIMIT = 50

/**
 * Planlama tahtası. Pasif (INACTIVE) makineler satır olarak çizilmez; bakım / arızadaki
 * makineler görünür (üzerlerinde iş ya da duruş olabilir). Her iş için görünen makinelerle
 * kalıp uygunluğu (`machineFit`) döner: tahta sürüklerken hedef satırı buna göre boyar; asıl
 * karar taşıma ucunda aynı motorla yeniden verilir. Bekleyen emirler (Taslak) da aynı biçimde
 * makine uygunluğuyla gelir: emrin ölçüsünü basan kalıplardan en iyisi.
 *
 * Planlanan ↔ gerçekleşen (4.3): her aktif iş için tahmin (`forecast` — ilerleme, tahmini bitiş,
 * gecikme, termin riski) ve kalıp bakım durumu (`moldMaintenance` — tahtadaki planlı baskılarla
 * öngörü). Tahmin pencere dışına taşabildiği için takvim istisnaları / duruşlar geniş aralıkla
 * okunur; yanıta yalnız penceredeki duruşlar gider.
 */
export const getProductionBoardHandler = (deps: IProductionBoardDependencies) => {
    return async (event: IGetProductionBoardEvent) => {
        const now = new Date()
        const from = event.queryStringParameters?.from ?? productionDateKey(now)
        const to = event.queryStringParameters?.to ?? addDaysToDateKey(from, DEFAULT_BOARD_DAYS - 1)
        const issue = findBoardRangeIssue(from, to)
        if (issue) throw new createError.BadRequest(issue)

        const { start, end } = boardRangeInstants(from, to)
        // Tahmin üretimin gerçek başından / şimdiden ileri yürür: takvim ve duruşlar pencereyle
        // birlikte BUGÜNÜ de kapsayan aralıkla okunur (uyarı taramasıyla aynı kural).
        const calendarRange = forecastCalendarRange({ from, to, windowStart: start, windowEnd: end, now })
        const [machines, areas, patterns, exceptions, allDowntimes, jobs, molds, pending] = await Promise.all([
            deps.productionMachineRepository.listMachines(),
            deps.productionAreaRepository.listAreas(),
            deps.productionShiftPatternRepository.listShiftPatterns(),
            deps.productionCalendarExceptionRepository.listExceptions(calendarRange.exceptions),
            deps.productionMachineDowntimeRepository.listDowntimes(calendarRange.downtimes),
            deps.productionJobRepository.listBoardJobs({ from: start, to: end }),
            deps.productionMoldRepository.listMolds(),
            deps.productionOrderRepository.listOrders({ page: 1, limit: BOARD_PENDING_ORDER_LIMIT, statuses: ["DRAFT"] }),
        ])
        const moldById = new Map(molds.map((mold) => [mold.id, mold]))
        const downtimes = allDowntimes.filter((downtime) => downtime.endAt > start && downtime.startAt < end)
        const areaShiftPatternIds = Object.fromEntries(areas.map((area) => [area.id, area.shiftPatternId]))

        const forecasts = forecastJobsOnMachines({
            jobs: jobs.map((job) => ({ ...job, dueDates: job.outputs.map((output) => output.order?.dueDate ?? null) })),
            machines,
            areaShiftPatternIds,
            patterns,
            exceptions,
            downtimes: allDowntimes,
            now,
        })
        // Kalıbın tahtadaki kapanmamış işlerinin kalan baskısı → bakım öngörüsü.
        const plannedShotsByMold = remainingShotsByMold(jobs.map((job) => ({ id: job.id, moldId: job.mold.id })), forecasts)

        const visibleMachines = machines.filter((machine) => machine.status !== "INACTIVE")
        const calendars = buildBoardMachineCalendars({
            machines: visibleMachines,
            areaShiftPatternIds,
            patterns,
            exceptions,
            from,
            to,
        })
        const calendarByMachine = new Map(calendars.map((calendar) => [calendar.machineId, calendar]))
        const machineIds = new Set(visibleMachines.map((machine) => machine.id))

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                range: { from, to, startAt: start, endAt: end },
                generatedAt: now,
                machines: visibleMachines.map((machine) => {
                    const calendar = calendarByMachine.get(machine.id)
                    return {
                        id: machine.id,
                        code: machine.code,
                        name: machine.name,
                        status: machine.status,
                        area: machine.area,
                        shiftPatternName: calendar?.shiftPatternName ?? null,
                        shifts: calendar?.shifts ?? [],
                        dayExceptions: calendar?.dayExceptions ?? [],
                    }
                }),
                downtimes: downtimes
                    .filter((downtime) => machineIds.has(downtime.machineId))
                    .map((downtime) => ({
                        id: downtime.id,
                        machineId: downtime.machineId,
                        startAt: downtime.startAt,
                        endAt: downtime.endAt,
                        kind: downtime.kind,
                        reason: downtime.reason,
                    })),
                pendingOrders: pending.data.flatMap((order) => {
                    const variant = order.productVariant
                    if (!variant) return []
                    const orderMolds = variant.molds
                        .filter((summary) => summary.status !== "RETIRED")
                        .map((summary) => moldById.get(summary.id))
                        .filter((mold): mold is NonNullable<typeof mold> => Boolean(mold))
                    return [{
                        id: order.id,
                        orderNumber: order.orderNumber,
                        status: order.status,
                        variantCode: order.variantCode,
                        productName: variant.product.name,
                        sizeLabel: variant.size.label,
                        quantity: order.quantity,
                        dueDate: order.dueDate,
                        priority: order.priority,
                        colorHex: variant.version.colorHex,
                        colorName: variant.version.colorName,
                        machineFit: visibleMachines.map((machine) => ({
                            machineId: machine.id,
                            verdict: bestCompatibilityVerdict(orderMolds.map((mold) => evaluateMoldMachineCompatibility(mold, machine).verdict)),
                        })),
                    }]
                }),
                pendingOrderTotal: pending.meta.total,
                jobs: jobs.map((job) => {
                    const mold = moldById.get(job.mold.id)
                    return {
                        ...job,
                        forecast: forecasts.get(job.id),
                        moldMaintenance: moldMaintenanceStatus(job.mold, plannedShotsByMold.get(job.mold.id) ?? 0),
                        machineFit: visibleMachines.map((machine) => {
                            if (!mold) return { machineId: machine.id, verdict: "unknown" as const, reason: null }
                            const result = evaluateMoldMachineCompatibility(mold, machine)
                            const firstError = result.checks.find((check) => check.level === "error")
                            return { machineId: machine.id, verdict: result.verdict, reason: firstError ? `${firstError.label}: ${firstError.message}` : null }
                        }),
                    }
                }),
            },
        })
    }
}
