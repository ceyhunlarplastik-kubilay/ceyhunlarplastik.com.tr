import { prisma } from "@/core/db/prisma"
import { isPrismaErrorCode } from "@/core/helpers/prisma/errors"
import type { ExistingJobLot, JobPlanWrite, JobRescheduleWrite } from "@/core/helpers/production/jobPlan"
import { formatLotNumber } from "@/core/helpers/production/jobPlan"
import { dateKeyToUtcDate, utcDateToDateKey } from "@/core/helpers/production/productionCalendar"
import { ON_FLOOR_JOB_STATUSES, type JobCompletionOutput } from "@/core/helpers/production/jobStateMachine"
import { formatProductionOrderNumber, type ProductionOrderStatus } from "@/core/helpers/production/productionOrders"
import { buildProductSizeCode } from "@/core/helpers/productVariants/variantCode"
import type { Prisma, ProductionJobStatus } from "@/prisma/generated/prisma/client"

/** Takvimi hâlâ meşgul eden işler — tamamlanan ve iptal edilen hariç. */
export const ACTIVE_JOB_STATUSES: ProductionJobStatus[] = ["PLANNED", "RELEASED", "SETUP", "RUNNING", "PAUSED"]

/** Tahtadaki çubuk — dar DTO (yalnız çizim + ayrıntı dialog'u için). */
export type BoardJobDto = {
    id: string
    lotBaseNumber: number
    status: ProductionJobStatus
    /** İyimser kilit — taşıma isteği bunu `expectedVersion` olarak geri gönderir. */
    version: number
    machineId: string
    /** Baskı sayacı + bakım aralığı — tahta bakım uyarısı (4.3). */
    mold: { id: string; code: string; name: string; totalShots: number; maintenanceIntervalShots: number | null; shotsAtLastMaintenance: number }
    setupStartAt: Date
    productionStartAt: Date
    plannedEndAt: Date
    plannedShots: number
    cycleTimeSec: number
    efficiencyPercent: number
    setupMinutes: number
    /** Emre bağlı ilk varyantın rengi — çubuğun sol şeridi. */
    colorHex: string | null
    colorName: string | null
    outputs: Array<{
        productSizeId: string
        cavities: number
        plannedQuantity: number
        order: { id: string; orderNumber: string; variantCode: string; quantity: number; dueDate: string | null } | null
    }>
    lots: Array<{
        lotNumber: string
        sequence: number
        shiftDate: string
        shiftCode: string
        plannedStartAt: Date
        plannedEndAt: Date
        plannedShots: number
        /** Gerçekleşen (4.2 vardiya raporu / lot başlatma). */
        status: "PLANNED" | "RUNNING" | "COMPLETED" | "CANCELLED"
        actualStartAt: Date | null
        actualEndAt: Date | null
        actualShots: number | null
        reported: boolean
    }>
}

/** Uyarı taraması (4.5): tahmin alanları + makine kodu + emirler (en yakın termin önce, terminsiz sonda). */
export type AlertJobDto = ForecastJobDto & {
    machineCode: string
    orders: Array<{ orderNumber: string; variantCode: string; dueDate: string | null }>
}

/** Tahmin (4.3) için dar okuma — "sonrakileri kaydır" ucunda sunucu tahmini yeniden hesaplar. */
export type ForecastJobDto = {
    id: string
    status: ProductionJobStatus
    lotBaseNumber: number
    machineId: string
    moldId: string
    setupStartAt: Date
    productionStartAt: Date
    plannedEndAt: Date
    plannedShots: number
    cycleTimeSec: number
    efficiencyPercent: number
    setupMinutes: number
    lots: Array<{ status: "PLANNED" | "RUNNING" | "COMPLETED" | "CANCELLED"; actualStartAt: Date | null; actualEndAt: Date | null; actualShots: number | null; reported: boolean }>
    /** Emirlerin terminleri ("YYYY-MM-DD"). */
    dueDates: string[]
}

export type ProductionJobSummary = {
    id: string
    status: ProductionJobStatus
    lotBaseNumber: number
    machineId: string
    moldId: string
    version: number
    orderIds: string[]
    outputs: Array<{ id: string; moldOutputId: string; cavities: number }>
    /** Lotlar — taşımada sıraya göre eşlenir; not / lota özel ekip sayıları silme engeli için. */
    lots: Array<ExistingJobLot & { shiftDate: string; shiftCode: string; actualShots: number | null; reported: boolean }>
}

const jobLotSummarySelect = {
    orderBy: { sequence: "asc" },
    select: {
        id: true,
        sequence: true,
        shiftDate: true,
        shiftCode: true,
        actualShots: true,
        reportedAt: true,
        _count: { select: { notes: true, operators: true } },
    },
} satisfies Prisma.ProductionJob$lotsArgs

function toJobLotSummary(lot: {
    id: string
    sequence: number
    shiftDate: Date
    shiftCode: string
    actualShots: number | null
    reportedAt: Date | null
    _count: { notes: number; operators: number }
}) {
    return {
        id: lot.id,
        sequence: lot.sequence,
        shiftDate: utcDateToDateKey(lot.shiftDate),
        shiftCode: lot.shiftCode,
        noteCount: lot._count.notes,
        lotOperatorCount: lot._count.operators,
        actualShots: lot.actualShots,
        reported: lot.reportedAt !== null,
    }
}

/** Kaydırma adayı — sıra, sürüm ve yeniden planlama için gereken alanlar. */
export type RippleJobDto = ProductionJobSummary & { setupStartAt: Date; plannedEndAt: Date }

/** Tek yazım: (varsa) yeni iş + (varsa) taşınan / kaydırılan işler. */
export type PlacementWrite = {
    create?: { plan: JobPlanWrite; orderId: string }
    reschedules: Array<{ id: string; expectedVersion: number; write: JobRescheduleWrite }>
}

/** Pano kartı — dar DTO. */
export type KanbanJobDto = {
    id: string
    lotBaseNumber: number
    status: ProductionJobStatus
    version: number
    /** Son durum değişikliği yaklaşığı ("son 7 günde tamamlanan" süzgeci). */
    updatedAt: Date
    machine: { id: string; code: string; name: string; area: { id: string; code: string; name: string } }
    mold: { id: string; code: string; name: string }
    setupStartAt: Date
    productionStartAt: Date
    plannedEndAt: Date
    plannedShots: number
    colorHex: string | null
    colorName: string | null
    lotCount: number
    /** Vardiya raporu girilmiş lot sayısı (Dilim 4.2). */
    reportedLotCount: number
    outputs: Array<{
        id: string
        cavities: number
        plannedQuantity: number
        goodQuantity: number
        scrapQuantity: number
        /** Raporlanan lotların toplamı — tamamlama dialog'unun önerisi. */
        reportedGoodQuantity: number
        reportedScrapQuantity: number
        /** "10.5.8" · ürün modeli adı */
        sizeCode: string
        productName: string
        order: { id: string; orderNumber: string; variantCode: string; quantity: number; dueDate: string | null } | null
    }>
}

/** Durum geçişi yazımı: iş (sürüm filtreli) + tamamlama adetleri + lotlar + türeyen emir durumları. */
export type JobTransitionWrite = {
    id: string
    expectedVersion: number
    /** Durum geçmişine yazılır. */
    fromStatus: ProductionJobStatus
    userId: string | null
    status: ProductionJobStatus
    outputs?: JobCompletionOutput[]
    /** `from` hâlâ geçerliyse `to` yazılır (arada elle değiştirilen emir ezilmez). */
    orderStatuses: Array<{ orderId: string; from: ProductionOrderStatus; to: ProductionOrderStatus }>
    /** Tamamlamada vardiya ekibinden dondurulan lot ekipleri (lota özel ekibi olmayan lotlar). */
    lotOperatorSnapshots?: Array<{ lotId: string; operatorId: string }>
    /** Tamamlamada raporsuz lotların baskısı kalıp sayacına eklenir. */
    moldShotIncrement?: { moldId: string; shots: number } | null
}

export type ActiveJobInterval = { id: string; machineId: string; moldId: string; startAt: Date; endAt: Date }

export interface IPrismaProductionJobRepository {
    listActiveJobIntervals(range: { from: Date; to: Date }): Promise<ActiveJobInterval[]>
    /**
     * Planı yazar: iş + çıktılar + lotlar + lot çıktıları + emrin durumu (Taslak/Beklemede →
     * Planlandı). Kimlikler önceden üretildiği için tek DİZİ transaction'ı (etkileşimli değil).
     * Dönüş: işin lot kökü.
     */
    createJobPlan(plan: JobPlanWrite, orderId: string): Promise<{ jobId: string; lotBaseNumber: number }>
    getJob(id: string): Promise<ProductionJobSummary | null>
    /** İşi siler; başka işi kalmayan Planlandı emirleri Taslağa döner. */
    deleteJob(id: string, orderIds: string[]): Promise<void>
    /**
     * Tahta: planlı aralığı pencereyle kesişen, iptal edilmemiş işler + planlı bitişi pencereden
     * önce kalmış ama sahada hâlâ açık işler (geciken iş makineyi tutmaya devam eder, 4.3).
     */
    listBoardJobs(range: { from: Date; to: Date }): Promise<BoardJobDto[]>
    getJobForForecast(id: string): Promise<ForecastJobDto | null>
    /**
     * Uyarı taraması: sahadaki (Sahaya verildi … Duraklatıldı) işler + planlı üretim başı `now`'dan
     * önce kalmış (başlaması gereken) planlı işler. Gelecekteki planlı işin gecikmesi / termin riski
     * planlama anında zaten görünür ("Öner"), bildirim üretmez.
     */
    listJobsForAlerts(now: Date): Promise<AlertJobDto[]>
    /** Planlı üretim başı `now`'dan sonra olan planlı işlerin kalıp başına baskı toplamı (bakım öngörüsü). */
    sumUpcomingPlannedShotsByMold(now: Date): Promise<Map<string, number>>
    /**
     * Taşıma: iş satırı (sürüm eşleşirse) + lotların yeniden yazımı, tek DİZİ transaction'ı.
     * Sürüm tutmazsa (başkası taşımış) hiçbir şey yazılmaz ve `null` döner.
     */
    rescheduleJob(id: string, expectedVersion: number, write: JobRescheduleWrite): Promise<{ version: number } | null>
    /** Makinede `from` ve sonrasında başlayan planlı işler ("sonrakileri kaydır" adayları). */
    listPlannedJobsOnMachine(machineId: string, from: Date): Promise<RippleJobDto[]>
    /**
     * Yeni iş + taşımalar tek DİZİ transaction'ında. Taşımaların herhangi birinde sürüm tutmazsa
     * hepsi geri alınır ve `null` döner.
     */
    commitPlacement(write: PlacementWrite): Promise<{ created: { jobId: string; lotBaseNumber: number } | null; versions: Record<string, number> } | null>
    /** Pano: iptal edilmemiş, tamamlanmamış işler + `completedSince`'ten beri tamamlananlar. */
    listKanbanJobs(input: { completedSince: Date }): Promise<KanbanJobDto[]>
    /** Emirlerin güncel durumu ve işlerinin durumları (emir durumu türetmek için). */
    listOrderJobStatuses(orderIds: string[]): Promise<Array<{ orderId: string; status: ProductionOrderStatus; jobs: Array<{ id: string; status: ProductionJobStatus }> }>>
    /** Tek DİZİ transaction'ı; iş sürümü tutmazsa hiçbir şey yazılmaz ve `null` döner. */
    transitionJob(write: JobTransitionWrite): Promise<{ version: number } | null>
}

export const productionJobRepository = (): IPrismaProductionJobRepository => {
    const listActiveJobIntervals = async ({ from, to }: { from: Date; to: Date }) => {
        const jobs = await prisma.productionJob.findMany({
            where: { status: { in: ACTIVE_JOB_STATUSES }, plannedEndAt: { gt: from }, setupStartAt: { lt: to } },
            select: { id: true, machineId: true, moldId: true, setupStartAt: true, plannedEndAt: true },
        })
        return jobs.map((job) => ({
            id: job.id,
            machineId: job.machineId,
            moldId: job.moldId,
            startAt: job.setupStartAt,
            endAt: job.plannedEndAt,
        }))
    }

    const createOps = ({ plan, orderId }: NonNullable<PlacementWrite["create"]>): Prisma.PrismaPromise<unknown>[] => [
        prisma.productionJob.create({ data: plan.job, select: { id: true, lotBaseNumber: true } }),
        prisma.productionJobStatusChange.create({
            data: { jobId: plan.job.id, fromStatus: null, toStatus: "PLANNED", userId: plan.job.createdByUserId },
            select: { id: true },
        }),
        prisma.productionJobOutput.createMany({ data: plan.outputs }),
        prisma.productionLot.createMany({
            data: plan.lots.map((lot) => ({ ...lot, shiftDate: dateKeyToUtcDate(lot.shiftDate) })),
        }),
        prisma.productionLotOutput.createMany({ data: plan.lotOutputs }),
        prisma.productionOrder.updateMany({
            where: { id: orderId, status: { in: ["DRAFT", "ON_HOLD"] } },
            data: { status: "PLANNED" },
        }),
    ]

    const rescheduleOps = ({ id, expectedVersion, write }: PlacementWrite["reschedules"][number]): Prisma.PrismaPromise<unknown>[] => [
        // `version` filtresi tutmazsa P2025 → transaction'ın tamamı geri alınır.
        prisma.productionJob.update({
            where: { id, version: expectedVersion },
            data: { ...write.job, version: { increment: 1 } },
            select: { id: true, version: true },
        }),
        // Planlı işte sayım yok: lot çıktıları baştan yazılır (lot KİMLİKLERİ korunur).
        prisma.productionLotOutput.deleteMany({ where: { lot: { jobId: id } } }),
        ...(write.lotDeleteIds.length > 0
            ? [prisma.productionLot.deleteMany({ where: { id: { in: write.lotDeleteIds }, jobId: id } })]
            : []),
        // Sıra değişmediği için (jobId, sequence) tekilliği çakışmaz.
        ...write.lotUpdates.map(({ id: lotId, shiftDate, ...lot }) => prisma.productionLot.update({
            where: { id: lotId, jobId: id },
            data: { ...lot, shiftDate: dateKeyToUtcDate(shiftDate) },
            select: { id: true },
        })),
        ...(write.lotCreates.length > 0
            ? [prisma.productionLot.createMany({
                data: write.lotCreates.map((lot) => ({ ...lot, shiftDate: dateKeyToUtcDate(lot.shiftDate) })),
            })]
            : []),
        prisma.productionLotOutput.createMany({ data: write.lotOutputs }),
        ...write.outputQuantities.map((output) => prisma.productionJobOutput.update({
            where: { id: output.id },
            data: { plannedQuantity: output.plannedQuantity },
            select: { id: true },
        })),
    ]

    const commitPlacement = async (write: PlacementWrite) => {
        const created = write.create ? createOps(write.create) : []
        const moves = write.reschedules.map(rescheduleOps)
        try {
            const results = await prisma.$transaction([...created, ...moves.flat()])
            const versions: Record<string, number> = {}
            let index = created.length
            for (const ops of moves) {
                const job = results[index] as { id: string; version: number }
                versions[job.id] = job.version
                index += ops.length
            }
            const job = write.create ? results[0] as { id: string; lotBaseNumber: number } : null
            return { created: job ? { jobId: job.id, lotBaseNumber: job.lotBaseNumber } : null, versions }
        } catch (error) {
            if (isPrismaErrorCode(error, "P2025")) return null
            throw error
        }
    }

    const createJobPlan = async (plan: JobPlanWrite, orderId: string) => {
        const result = await commitPlacement({ create: { plan, orderId }, reschedules: [] })
        if (!result?.created) throw new Error("İş yazılamadı.")
        return result.created
    }

    const rescheduleJob = async (id: string, expectedVersion: number, write: JobRescheduleWrite) => {
        const result = await commitPlacement({ reschedules: [{ id, expectedVersion, write }] })
        return result ? { version: result.versions[id] } : null
    }

    const listPlannedJobsOnMachine = async (machineId: string, from: Date) => {
        const jobs = await prisma.productionJob.findMany({
            where: { machineId, status: "PLANNED", setupStartAt: { gte: from } },
            orderBy: { setupStartAt: "asc" },
            select: {
                id: true,
                status: true,
                lotBaseNumber: true,
                machineId: true,
                moldId: true,
                version: true,
                setupStartAt: true,
                plannedEndAt: true,
                outputs: { select: { id: true, moldOutputId: true, productionOrderId: true, cavities: true } },
                lots: jobLotSummarySelect,
            },
        })
        return jobs.map(({ outputs, lots, ...job }) => ({
            ...job,
            outputs: outputs.map((output) => ({ id: output.id, moldOutputId: output.moldOutputId, cavities: output.cavities })),
            lots: lots.map(toJobLotSummary),
            orderIds: [...new Set(outputs.map((output) => output.productionOrderId).filter((value): value is string => Boolean(value)))],
        }))
    }

    const getJob = async (id: string) => {
        const job = await prisma.productionJob.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                lotBaseNumber: true,
                machineId: true,
                moldId: true,
                version: true,
                outputs: { select: { id: true, moldOutputId: true, productionOrderId: true, cavities: true } },
                lots: jobLotSummarySelect,
            },
        })
        if (!job) return null
        return {
            id: job.id,
            status: job.status,
            lotBaseNumber: job.lotBaseNumber,
            machineId: job.machineId,
            moldId: job.moldId,
            version: job.version,
            outputs: job.outputs.map((output) => ({ id: output.id, moldOutputId: output.moldOutputId, cavities: output.cavities })),
            lots: job.lots.map(toJobLotSummary),
            orderIds: [...new Set(job.outputs.map((output) => output.productionOrderId).filter((value): value is string => Boolean(value)))],
        }
    }

    const deleteJob = async (id: string, orderIds: string[]) => {
        await prisma.$transaction([
            prisma.productionJob.delete({ where: { id } }),
            prisma.productionOrder.updateMany({
                where: { id: { in: orderIds }, status: "PLANNED", jobOutputs: { none: {} } },
                data: { status: "DRAFT" },
            }),
        ])
    }

    const listBoardJobs = async ({ from, to }: { from: Date; to: Date }) => {
        const jobs = await prisma.productionJob.findMany({
            where: {
                status: { not: "CANCELLED" },
                setupStartAt: { lt: to },
                OR: [{ plannedEndAt: { gt: from } }, { status: { in: ON_FLOOR_JOB_STATUSES } }],
            },
            orderBy: { setupStartAt: "asc" },
            select: {
                id: true,
                lotBaseNumber: true,
                status: true,
                version: true,
                machineId: true,
                mold: { select: { id: true, code: true, name: true, totalShots: true, maintenanceIntervalShots: true, shotsAtLastMaintenance: true } },
                setupStartAt: true,
                productionStartAt: true,
                plannedEndAt: true,
                plannedShots: true,
                cycleTimeSec: true,
                efficiencyPercent: true,
                setupMinutes: true,
                outputs: {
                    select: {
                        productSizeId: true,
                        cavities: true,
                        plannedQuantity: true,
                        productionOrder: {
                            select: {
                                id: true,
                                orderNumber: true,
                                variantCode: true,
                                quantity: true,
                                dueDate: true,
                                productVariant: { select: { version: { select: { color: { select: { hex: true, name: true } } } } } },
                            },
                        },
                    },
                },
                lots: {
                    orderBy: { sequence: "asc" },
                    select: {
                        sequence: true,
                        shiftDate: true,
                        shiftCode: true,
                        plannedStartAt: true,
                        plannedEndAt: true,
                        plannedShots: true,
                        status: true,
                        actualStartAt: true,
                        actualEndAt: true,
                        actualShots: true,
                        reportedAt: true,
                    },
                },
            },
        })

        return jobs.map(({ outputs, lots, ...job }) => {
            const color = outputs.find((output) => output.productionOrder?.productVariant?.version.color)
                ?.productionOrder?.productVariant?.version.color ?? null
            return {
                ...job,
                colorHex: color?.hex ?? null,
                colorName: color?.name ?? null,
                outputs: outputs.map((output) => ({
                    productSizeId: output.productSizeId,
                    cavities: output.cavities,
                    plannedQuantity: output.plannedQuantity,
                    order: output.productionOrder
                        ? {
                            id: output.productionOrder.id,
                            orderNumber: formatProductionOrderNumber(output.productionOrder.orderNumber),
                            variantCode: output.productionOrder.variantCode,
                            quantity: output.productionOrder.quantity,
                            dueDate: output.productionOrder.dueDate ? utcDateToDateKey(output.productionOrder.dueDate) : null,
                        }
                        : null,
                })),
                lots: lots.map(({ reportedAt, ...lot }) => ({
                    ...lot,
                    lotNumber: formatLotNumber(job.lotBaseNumber, lot.sequence),
                    shiftDate: utcDateToDateKey(lot.shiftDate),
                    reported: reportedAt !== null,
                })),
            }
        })
    }

    const getJobForForecast = async (id: string) => {
        const job = await prisma.productionJob.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                lotBaseNumber: true,
                machineId: true,
                moldId: true,
                setupStartAt: true,
                productionStartAt: true,
                plannedEndAt: true,
                plannedShots: true,
                cycleTimeSec: true,
                efficiencyPercent: true,
                setupMinutes: true,
                lots: { orderBy: { sequence: "asc" }, select: { status: true, actualStartAt: true, actualEndAt: true, actualShots: true, reportedAt: true } },
                outputs: { select: { productionOrder: { select: { dueDate: true } } } },
            },
        })
        if (!job) return null
        const { lots, outputs, ...rest } = job
        return {
            ...rest,
            lots: lots.map(({ reportedAt, ...lot }) => ({ ...lot, reported: reportedAt !== null })),
            dueDates: outputs
                .map((output) => output.productionOrder?.dueDate)
                .filter((date): date is Date => Boolean(date))
                .map(utcDateToDateKey),
        }
    }

    const listJobsForAlerts = async (now: Date): Promise<AlertJobDto[]> => {
        const jobs = await prisma.productionJob.findMany({
            where: {
                OR: [
                    { status: { in: ON_FLOOR_JOB_STATUSES } },
                    { status: "PLANNED", productionStartAt: { lte: now } },
                ],
            },
            orderBy: { setupStartAt: "asc" },
            select: {
                id: true,
                status: true,
                lotBaseNumber: true,
                machineId: true,
                machine: { select: { code: true } },
                moldId: true,
                setupStartAt: true,
                productionStartAt: true,
                plannedEndAt: true,
                plannedShots: true,
                cycleTimeSec: true,
                efficiencyPercent: true,
                setupMinutes: true,
                lots: { orderBy: { sequence: "asc" }, select: { status: true, actualStartAt: true, actualEndAt: true, actualShots: true, reportedAt: true } },
                outputs: { select: { productionOrder: { select: { orderNumber: true, variantCode: true, dueDate: true } } } },
            },
        })
        return jobs.map(({ lots, outputs, machine, ...job }) => {
            const orders = outputs
                .flatMap((output) => (output.productionOrder ? [output.productionOrder] : []))
                .map((order) => ({
                    orderNumber: formatProductionOrderNumber(order.orderNumber),
                    variantCode: order.variantCode,
                    dueDate: order.dueDate ? utcDateToDateKey(order.dueDate) : null,
                }))
                // En yakın termin önce; terminsiz sonda.
                .sort((a, b) => (a.dueDate ?? "9999-99-99").localeCompare(b.dueDate ?? "9999-99-99"))
            return {
                ...job,
                machineCode: machine.code,
                lots: lots.map(({ reportedAt, ...lot }) => ({ ...lot, reported: reportedAt !== null })),
                dueDates: orders.flatMap((order) => (order.dueDate ? [order.dueDate] : [])),
                orders,
            }
        })
    }

    const sumUpcomingPlannedShotsByMold = async (now: Date) => {
        const groups = await prisma.productionJob.groupBy({
            by: ["moldId"],
            where: { status: "PLANNED", productionStartAt: { gt: now } },
            _sum: { plannedShots: true },
        })
        return new Map(groups.map((group) => [group.moldId, group._sum.plannedShots ?? 0]))
    }

    const listKanbanJobs = async ({ completedSince }: { completedSince: Date }) => {
        const jobs = await prisma.productionJob.findMany({
            where: {
                OR: [
                    { status: { in: ACTIVE_JOB_STATUSES } },
                    // Tamamlanma anı durum geçmişinden (4.2); updatedAt yaklaşığı kalktı.
                    { status: "COMPLETED", statusChanges: { some: { toStatus: "COMPLETED", occurredAt: { gte: completedSince } } } },
                ],
            },
            orderBy: [{ setupStartAt: "asc" }],
            select: {
                id: true,
                lotBaseNumber: true,
                status: true,
                version: true,
                updatedAt: true,
                machine: { select: { id: true, code: true, name: true, area: { select: { id: true, code: true, name: true } } } },
                mold: { select: { id: true, code: true, name: true } },
                setupStartAt: true,
                productionStartAt: true,
                plannedEndAt: true,
                plannedShots: true,
                _count: { select: { lots: true } },
                lots: { where: { reportedAt: { not: null } }, select: { id: true } },
                outputs: {
                    orderBy: { productSizeId: "asc" },
                    select: {
                        id: true,
                        cavities: true,
                        plannedQuantity: true,
                        goodQuantity: true,
                        scrapQuantity: true,
                        lotOutputs: { where: { lot: { reportedAt: { not: null } } }, select: { goodQuantity: true, scrapQuantity: true } },
                        moldOutput: { select: { productSize: { select: { code: true, product: { select: { code: true, name: true } } } } } },
                        productionOrder: {
                            select: {
                                id: true,
                                orderNumber: true,
                                variantCode: true,
                                quantity: true,
                                dueDate: true,
                                productVariant: { select: { version: { select: { color: { select: { hex: true, name: true } } } } } },
                            },
                        },
                    },
                },
            },
        })

        return jobs.map(({ outputs, _count, lots: reportedLots, ...job }) => {
            const color = outputs.find((output) => output.productionOrder?.productVariant?.version.color)
                ?.productionOrder?.productVariant?.version.color ?? null
            return {
                ...job,
                colorHex: color?.hex ?? null,
                colorName: color?.name ?? null,
                lotCount: _count.lots,
                reportedLotCount: reportedLots.length,
                outputs: outputs.map(({ moldOutput, productionOrder, lotOutputs, ...output }) => ({
                    ...output,
                    reportedGoodQuantity: lotOutputs.reduce((sum, entry) => sum + entry.goodQuantity, 0),
                    reportedScrapQuantity: lotOutputs.reduce((sum, entry) => sum + entry.scrapQuantity, 0),
                    sizeCode: buildProductSizeCode(moldOutput.productSize.product.code, moldOutput.productSize.code),
                    productName: moldOutput.productSize.product.name,
                    order: productionOrder
                        ? {
                            id: productionOrder.id,
                            orderNumber: formatProductionOrderNumber(productionOrder.orderNumber),
                            variantCode: productionOrder.variantCode,
                            quantity: productionOrder.quantity,
                            dueDate: productionOrder.dueDate ? utcDateToDateKey(productionOrder.dueDate) : null,
                        }
                        : null,
                })),
            }
        })
    }

    const listOrderJobStatuses = async (orderIds: string[]) => {
        if (orderIds.length === 0) return []
        const orders = await prisma.productionOrder.findMany({
            where: { id: { in: orderIds } },
            select: { id: true, status: true, jobOutputs: { select: { job: { select: { id: true, status: true } } } } },
        })
        return orders.map((order) => {
            const jobs = new Map(order.jobOutputs.map((output) => [output.job.id, output.job]))
            return { orderId: order.id, status: order.status, jobs: [...jobs.values()] }
        })
    }

    const transitionJob = async (write: JobTransitionWrite) => {
        const operations: Prisma.PrismaPromise<unknown>[] = [
            // `version` filtresi tutmazsa P2025 → transaction'ın tamamı geri alınır.
            prisma.productionJob.update({
                where: { id: write.id, version: write.expectedVersion },
                data: { status: write.status, version: { increment: 1 } },
                select: { version: true },
            }),
            ...(write.outputs ?? []).map((output) => prisma.productionJobOutput.update({
                where: { id: output.jobOutputId, jobId: write.id },
                data: { goodQuantity: output.goodQuantity, scrapQuantity: output.scrapQuantity },
                select: { id: true },
            })),
            ...(write.status === "COMPLETED"
                ? [prisma.productionLot.updateMany({ where: { jobId: write.id, status: { in: ["PLANNED", "RUNNING"] } }, data: { status: "COMPLETED" } })]
                : []),
            ...(write.lotOperatorSnapshots && write.lotOperatorSnapshots.length > 0
                ? [prisma.productionLotOperator.createMany({ data: write.lotOperatorSnapshots, skipDuplicates: true })]
                : []),
            ...(write.moldShotIncrement && write.moldShotIncrement.shots > 0
                ? [prisma.mold.update({
                    where: { id: write.moldShotIncrement.moldId },
                    data: { totalShots: { increment: write.moldShotIncrement.shots } },
                    select: { id: true },
                })]
                : []),
            prisma.productionJobStatusChange.create({
                data: { jobId: write.id, fromStatus: write.fromStatus, toStatus: write.status, userId: write.userId },
                select: { id: true },
            }),
            ...write.orderStatuses.map((order) => prisma.productionOrder.updateMany({
                where: { id: order.orderId, status: order.from },
                data: { status: order.to },
            })),
        ]
        try {
            const [job] = await prisma.$transaction(operations)
            return { version: (job as { version: number }).version }
        } catch (error) {
            if (isPrismaErrorCode(error, "P2025")) return null
            throw error
        }
    }

    return {
        getJobForForecast,
        listJobsForAlerts,
        sumUpcomingPlannedShotsByMold,
        listKanbanJobs,
        listOrderJobStatuses,
        transitionJob,
        listActiveJobIntervals,
        createJobPlan,
        getJob,
        deleteJob,
        listBoardJobs,
        rescheduleJob,
        listPlannedJobsOnMachine,
        commitPlacement,
    }
}
