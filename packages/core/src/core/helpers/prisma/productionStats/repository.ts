import { prisma } from "@/core/db/prisma"
import { ACTIVE_JOB_STATUSES } from "@/core/helpers/prisma/productionJobs/repository"
import {
    toVariantVersion,
    variantVersionSelect,
    type VariantVersionDto,
} from "@/core/helpers/prisma/productionReferences/repository"
import { formatProductionOrderNumber } from "@/core/helpers/production/productionOrders"
import type { MachineStatsLotInput, UnreportedLotCandidate } from "@/core/helpers/production/machineStats"
import type { MoldStatsLotInput, OpenJobShotsInput } from "@/core/helpers/production/moldStats"
import {
    PRODUCT_HISTORY_JOB_LIMIT,
    PRODUCT_HISTORY_JOB_STATUSES,
    type StatsJobInput,
} from "@/core/helpers/production/productionStats"

/** Baskı ayarı imzasının okunur hâli — renk + hammadde (ürün modelinden bağımsız). */
export type VersionLabelDto = Pick<VariantVersionDto, "signature" | "colorName" | "colorHex" | "materials">

/**
 * Üretim istatistikleri (Faz 5) için okuma. Hesap saf modüllerde
 * (`core/helpers/production/productionStats.ts`, `machineStats.ts`); burada yalnız dar seçim.
 */
export interface IPrismaProductionStatsRepository {
    /** Ürün modelinin versiyonları — işin baskı ayarı imzası → V kodu, renk, hammadde. */
    listProductVersions(productId: string): Promise<VariantVersionDto[]>
    /**
     * Ürün geçmişi: verilen ölçülerden birini basan, üretime başlamış ya da bitmiş işler. Pencere:
     * planlı aralığı kesişen ya da bir lotu pencerede başlamış iş. En yeni önce, en çok
     * `PRODUCT_HISTORY_JOB_LIMIT` iş (fazlası `truncated`).
     */
    listProductHistoryJobs(input: {
        productSizeIds: string[]
        versionSignature: string | null
        from: Date
        to: Date
    }): Promise<{ jobs: StatsJobInput[]; truncated: boolean }>
    /**
     * Makine istatistiği (5.2): pencereyle KESİŞEN raporlu vardiyalar. Vardiyanın makinesi işin
     * makinesidir (sahaya verilen iş taşınamaz). `areaId` verilirse yalnız o alanın makineleri.
     */
    listMachineReportedLots(input: { from: Date; to: Date; areaId?: string }): Promise<MachineStatsLotInput[]>
    /**
     * Raporu girilmeden kapanan vardiya adayları — tamamlanan işin raporsuz lotları, gerçek (yoksa
     * planlanan) başlangıcı pencerede. Sayım kuralı core'da (`isUnreportedClosedLot`).
     */
    listMachineUnreportedLots(input: { from: Date; to: Date; areaId?: string }): Promise<UnreportedLotCandidate[]>
    /** Kalıp istatistiği (5.3): pencerede BAŞLAYAN raporlu vardiyalar — kalıp, makine, baskı ayarı, plan çevrimi. */
    listMoldStatsLots(input: { from: Date; to: Date }): Promise<MoldStatsLotInput[]>
    /** Açık işlerin (planlı … duraklatıldı) planlanan ve raporlanan baskısı — bakım öngörüsü. */
    listOpenJobShots(): Promise<OpenJobShotsInput[]>
    /**
     * İmza → renk + hammadde adları. Aynı imza farklı ürün modellerinde farklı V koduyla durur; kod
     * ürüne özel olduğu için dönmez, ilk eşleşen versiyonun adları yeter.
     */
    listVersionLabels(signatures: string[]): Promise<VersionLabelDto[]>
}

export const productionStatsRepository = (): IPrismaProductionStatsRepository => {
    const listProductVersions = async (productId: string) => {
        const versions = await prisma.variantVersion.findMany({
            where: { productId },
            orderBy: { code: "asc" },
            select: variantVersionSelect,
        })
        return versions.map(toVariantVersion)
    }

    const listProductHistoryJobs = async ({ productSizeIds, versionSignature, from, to }: {
        productSizeIds: string[]
        versionSignature: string | null
        from: Date
        to: Date
    }) => {
        if (productSizeIds.length === 0) return { jobs: [], truncated: false }
        const records = await prisma.productionJob.findMany({
            where: {
                status: { in: PRODUCT_HISTORY_JOB_STATUSES },
                outputs: { some: { productSizeId: { in: productSizeIds } } },
                ...(versionSignature ? { versionSignature } : {}),
                OR: [
                    { setupStartAt: { lt: to }, plannedEndAt: { gt: from } },
                    { lots: { some: { actualStartAt: { gte: from, lt: to } } } },
                ],
            },
            orderBy: [{ productionStartAt: "desc" }, { lotBaseNumber: "desc" }],
            take: PRODUCT_HISTORY_JOB_LIMIT + 1,
            select: {
                id: true,
                lotBaseNumber: true,
                status: true,
                versionSignature: true,
                productionStartAt: true,
                plannedEndAt: true,
                plannedShots: true,
                cycleTimeSec: true,
                efficiencyPercent: true,
                machine: { select: { code: true } },
                mold: { select: { code: true } },
                outputs: {
                    select: {
                        id: true,
                        productSizeId: true,
                        cavities: true,
                        plannedQuantity: true,
                        goodQuantity: true,
                        scrapQuantity: true,
                        productionOrder: { select: { orderNumber: true, variantCode: true } },
                    },
                },
                lots: {
                    orderBy: { sequence: "asc" },
                    select: {
                        status: true,
                        actualStartAt: true,
                        actualEndAt: true,
                        actualShots: true,
                        reportedAt: true,
                        stops: { select: { durationMinutes: true } },
                        outputs: { select: { jobOutputId: true, goodQuantity: true, scrapQuantity: true } },
                    },
                },
            },
        })

        const truncated = records.length > PRODUCT_HISTORY_JOB_LIMIT
        const jobs: StatsJobInput[] = records.slice(0, PRODUCT_HISTORY_JOB_LIMIT).map(({ machine, mold, outputs, lots, ...job }) => ({
            ...job,
            machineCode: machine.code,
            moldCode: mold.code,
            outputs: outputs.map(({ productionOrder, ...output }) => ({
                ...output,
                order: productionOrder
                    ? { orderNumber: formatProductionOrderNumber(productionOrder.orderNumber), variantCode: productionOrder.variantCode }
                    : null,
            })),
            lots: lots.map(({ reportedAt, stops, ...lot }) => ({
                ...lot,
                reported: reportedAt !== null,
                stopMinutes: stops.reduce((sum, stop) => sum + stop.durationMinutes, 0),
            })),
        }))
        return { jobs, truncated }
    }

    const listMachineReportedLots = async ({ from, to, areaId }: { from: Date; to: Date; areaId?: string }) => {
        const records = await prisma.productionLot.findMany({
            where: {
                reportedAt: { not: null },
                actualStartAt: { lt: to },
                actualEndAt: { gt: from },
                ...(areaId ? { job: { machine: { areaId } } } : {}),
            },
            select: {
                actualStartAt: true,
                actualEndAt: true,
                actualShots: true,
                job: { select: { machineId: true, cycleTimeSec: true } },
                stops: {
                    orderBy: { createdAt: "asc" },
                    select: { durationMinutes: true, reason: { select: { id: true, code: true, name: true, stopCategory: true } } },
                },
                outputs: { select: { goodQuantity: true, scrapQuantity: true } },
            },
        })
        return records.flatMap(({ actualStartAt, actualEndAt, actualShots, job, stops, outputs }): MachineStatsLotInput[] => {
            // Rapor iki ucu da yazar; eksikse (bozuk kayıt) süre hesaplanamaz.
            if (!actualStartAt || !actualEndAt) return []
            return [{
                machineId: job.machineId,
                actualStartAt,
                actualEndAt,
                actualShots,
                cycleTimeSec: job.cycleTimeSec,
                stops: stops.map((stop) => ({
                    minutes: stop.durationMinutes,
                    category: stop.reason.stopCategory,
                    reasonId: stop.reason.id,
                    reasonCode: stop.reason.code,
                    reasonName: stop.reason.name,
                })),
                goodQuantity: outputs.reduce((sum, output) => sum + output.goodQuantity, 0),
                scrapQuantity: outputs.reduce((sum, output) => sum + output.scrapQuantity, 0),
            }]
        })
    }

    const listMachineUnreportedLots = async ({ from, to, areaId }: { from: Date; to: Date; areaId?: string }) => {
        const records = await prisma.productionLot.findMany({
            where: {
                // Raporsuz COMPLETED lot yalnız iş tamamlanırken oluşur.
                status: "COMPLETED",
                reportedAt: null,
                job: { status: "COMPLETED", ...(areaId ? { machine: { areaId } } : {}) },
                OR: [
                    { actualStartAt: { gte: from, lt: to } },
                    { actualStartAt: null, plannedStartAt: { gte: from, lt: to } },
                ],
            },
            select: {
                plannedStartAt: true,
                actualStartAt: true,
                job: {
                    select: {
                        machineId: true,
                        statusChanges: {
                            where: { toStatus: "COMPLETED" },
                            orderBy: { occurredAt: "desc" },
                            take: 1,
                            select: { occurredAt: true },
                        },
                    },
                },
            },
        })
        return records.map(({ plannedStartAt, actualStartAt, job }): UnreportedLotCandidate => ({
            machineId: job.machineId,
            plannedStartAt,
            actualStartAt,
            jobCompletedAt: job.statusChanges[0]?.occurredAt ?? null,
        }))
    }

    const listMoldStatsLots = async ({ from, to }: { from: Date; to: Date }) => {
        const records = await prisma.productionLot.findMany({
            where: { reportedAt: { not: null }, actualStartAt: { gte: from, lt: to }, actualEndAt: { not: null } },
            select: {
                actualStartAt: true,
                actualEndAt: true,
                actualShots: true,
                job: { select: { moldId: true, machineId: true, versionSignature: true, cycleTimeSec: true, machine: { select: { code: true } } } },
                stops: { select: { durationMinutes: true } },
                outputs: { select: { goodQuantity: true, scrapQuantity: true } },
            },
        })
        return records.flatMap(({ actualStartAt, actualEndAt, actualShots, job, stops, outputs }): MoldStatsLotInput[] => {
            if (!actualStartAt || !actualEndAt) return []
            return [{
                moldId: job.moldId,
                machineId: job.machineId,
                machineCode: job.machine.code,
                versionSignature: job.versionSignature,
                plannedCycleSec: job.cycleTimeSec,
                actualStartAt,
                actualEndAt,
                actualShots,
                stopMinutes: stops.reduce((sum, stop) => sum + stop.durationMinutes, 0),
                goodQuantity: outputs.reduce((sum, output) => sum + output.goodQuantity, 0),
                scrapQuantity: outputs.reduce((sum, output) => sum + output.scrapQuantity, 0),
            }]
        })
    }

    const listOpenJobShots = async () => {
        const jobs = await prisma.productionJob.findMany({
            where: { status: { in: ACTIVE_JOB_STATUSES } },
            select: { moldId: true, plannedShots: true, lots: { where: { reportedAt: { not: null } }, select: { actualShots: true } } },
        })
        return jobs.map(({ moldId, plannedShots, lots }) => ({
            moldId,
            plannedShots,
            reportedShots: lots.reduce((sum, lot) => sum + (lot.actualShots ?? 0), 0),
        }))
    }

    const listVersionLabels = async (signatures: string[]) => {
        if (signatures.length === 0) return []
        const versions = await prisma.variantVersion.findMany({
            where: { signature: { in: signatures } },
            distinct: ["signature"],
            orderBy: { signature: "asc" },
            select: variantVersionSelect,
        })
        return versions.map((version) => {
            const { signature, colorName, colorHex, materials } = toVariantVersion(version)
            return { signature, colorName, colorHex, materials }
        })
    }

    return {
        listProductVersions,
        listProductHistoryJobs,
        listMachineReportedLots,
        listMachineUnreportedLots,
        listMoldStatsLots,
        listOpenJobShots,
        listVersionLabels,
    }
}
