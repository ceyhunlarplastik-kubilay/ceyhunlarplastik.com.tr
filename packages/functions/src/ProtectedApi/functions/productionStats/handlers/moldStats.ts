import createError from "http-errors"

import { buildMoldStats, MOLD_STATS_DEFAULT_RANGE_DAYS } from "@/core/helpers/production/moldStats"
import { boardRangeInstants } from "@/core/helpers/production/productionBoard"
import { findStatsRangeIssue, recentStatsRange } from "@/core/helpers/production/productionStats"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type { IGetMoldStatsEvent, IMoldStatsDependencies } from "@/functions/ProtectedApi/types/productionStats"

/**
 * Kalıp istatistikleri (Faz 5.3): sayaç ve bakım (açık işlerin kalanıyla öngörü), pencerede başlayan
 * raporlu vardiyalardan gerçek çevrim — kalıp, kalıp × makine (kart ve öneri), kalıp × renk /
 * hammadde. Kurallar core `moldStats.ts`'te; burada pencere, okuma ve imzaların okunur adı.
 */
export const getMoldStatsHandler = (deps: IMoldStatsDependencies) => {
    return async (event: IGetMoldStatsEvent) => {
        const query = event.queryStringParameters ?? {}
        const now = new Date()
        const defaults = recentStatsRange(now, MOLD_STATS_DEFAULT_RANGE_DAYS)
        const from = query.from ?? defaults.from
        const to = query.to ?? defaults.to
        const issue = findStatsRangeIssue(from, to)
        if (issue) throw new createError.BadRequest(issue)

        const { start, end } = boardRangeInstants(from, to)
        const [molds, lots, openJobs] = await Promise.all([
            deps.productionMoldRepository.listMolds(),
            deps.productionStatsRepository.listMoldStatsLots({ from: start, to: end }),
            deps.productionStatsRepository.listOpenJobShots(),
        ])
        const labels = await deps.productionStatsRepository.listVersionLabels([...new Set(lots.map((lot) => lot.versionSignature))])
        const labelBySignature = new Map(labels.map((label) => [label.signature, label]))

        const { rows, summary } = buildMoldStats({
            molds: molds.map((mold) => ({
                id: mold.id,
                code: mold.code,
                name: mold.name,
                status: mold.status,
                standardCycleTimeSec: mold.standardCycleTimeSec,
                totalShots: mold.totalShots,
                maintenanceIntervalShots: mold.maintenanceIntervalShots,
                shotsAtLastMaintenance: mold.shotsAtLastMaintenance,
                lastMaintenanceAt: mold.lastMaintenanceAt,
                machineProfiles: mold.machineProfiles.map((profile) => ({
                    machineId: profile.machineId,
                    machineCode: profile.machine.code,
                    cycleTimeSec: profile.cycleTimeSec,
                })),
            })),
            lots,
            openJobs,
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: {
                range: { from, to },
                generatedAt: now,
                rows: rows.map((row) => ({
                    ...row,
                    versions: row.versions.map((version) => {
                        const label = labelBySignature.get(version.versionSignature)
                        return { ...version, colorName: label?.colorName ?? null, colorHex: label?.colorHex ?? null, materials: label?.materials ?? [] }
                    }),
                })),
                summary,
            },
        })
    }
}
