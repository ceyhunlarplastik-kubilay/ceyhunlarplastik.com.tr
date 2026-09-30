import createError from "http-errors"

import {
    buildMachineStats,
    MACHINE_STATS_DEFAULT_RANGE_DAYS,
    MACHINE_STATS_MAX_RANGE_DAYS,
} from "@/core/helpers/production/machineStats"
import { addDaysToDateKey } from "@/core/helpers/production/productionCalendar"
import { boardRangeInstants } from "@/core/helpers/production/productionBoard"
import { findStatsRangeIssue, recentStatsRange } from "@/core/helpers/production/productionStats"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type { IGetMachineStatsEvent, IMachineStatsDependencies } from "@/functions/ProtectedApi/types/productionStats"

/**
 * Makine kullanımı ve OEE (Faz 5.2): makine başına zaman dağılımı (vardiya süresi → üretim, makine
 * duruşu, boş) ve raporlu vardiyalardan OEE. Hesap kuralları core `machineStats.ts`'te; burada
 * pencere, alan süzgeci ve okuma. Pencere ŞİMDİ'de biter: bugünün henüz gelmemiş vardiyaları boş
 * görünmesin.
 */
export const getMachineStatsHandler = (deps: IMachineStatsDependencies) => {
    return async (event: IGetMachineStatsEvent) => {
        const query = event.queryStringParameters ?? {}
        const now = new Date()
        const defaults = recentStatsRange(now, MACHINE_STATS_DEFAULT_RANGE_DAYS)
        const from = query.from ?? defaults.from
        const to = query.to ?? defaults.to
        const issue = findStatsRangeIssue(from, to, MACHINE_STATS_MAX_RANGE_DAYS)
        if (issue) throw new createError.BadRequest(issue)

        const range = boardRangeInstants(from, to)
        const window = { start: range.start, end: range.end < now ? range.end : now }
        if (window.end < window.start) window.end = window.start

        const [machines, areas, patterns, exceptions, downtimes, lots, unreportedLots] = await Promise.all([
            deps.productionMachineRepository.listMachines(),
            deps.productionAreaRepository.listAreas(),
            deps.productionShiftPatternRepository.listShiftPatterns(),
            // Pencerenin ilk anında önceki günün gece vardiyası sürüyor olabilir.
            deps.productionCalendarExceptionRepository.listExceptions({ from: addDaysToDateKey(from, -1), to }),
            deps.productionMachineDowntimeRepository.listDowntimes({ from: window.start, to: window.end }),
            deps.productionStatsRepository.listMachineReportedLots({ from: window.start, to: window.end, areaId: query.areaId }),
            deps.productionStatsRepository.listMachineUnreportedLots({ from: window.start, to: window.end, areaId: query.areaId }),
        ])
        if (query.areaId && !areas.some((area) => area.id === query.areaId)) {
            throw new createError.BadRequest("Üretim alanı bulunamadı.")
        }

        const stats = buildMachineStats({
            window,
            machines: machines
                .filter((machine) => !query.areaId || machine.areaId === query.areaId)
                .map((machine) => ({
                    id: machine.id,
                    areaId: machine.areaId,
                    shiftPatternId: machine.shiftPatternId,
                    code: machine.code,
                    name: machine.name,
                    areaCode: machine.area.code,
                    status: machine.status,
                })),
            areaShiftPatternIds: Object.fromEntries(areas.map((area) => [area.id, area.shiftPatternId])),
            patterns,
            exceptions,
            downtimes,
            lots,
            unreportedLots,
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                range: { from, to, startAt: window.start, endAt: window.end },
                generatedAt: now,
                areaId: query.areaId ?? null,
                // Süzgeç seçenekleri: makinesi olan alanlar.
                areas: areas.filter((area) => area.machineCount > 0).map((area) => ({ id: area.id, code: area.code, name: area.name })),
                ...stats,
            },
        })
    }
}
