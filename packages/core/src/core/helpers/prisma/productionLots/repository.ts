import { prisma } from "@/core/db/prisma"
import { isPrismaErrorCode } from "@/core/helpers/prisma/errors"
import type { IPaginatedResult } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import { operatorRefSelect, type OperatorRefDto } from "@/core/helpers/prisma/productionShiftAssignments/repository"
import { dateKeyToUtcDate, utcDateToDateKey } from "@/core/helpers/production/productionCalendar"
import { formatLotNumber, parseLotNumber, type ProductionLotNoteCategory } from "@/core/helpers/production/productionLots"
import { formatProductionOrderNumber, parseProductionOrderNumber } from "@/core/helpers/production/productionOrders"
import { buildProductSizeCode } from "@/core/helpers/productVariants/variantCode"
import type { ProductionJobStatus } from "@/core/helpers/production/jobStateMachine"
import type { ProductionStopCategory } from "@/core/helpers/production/productionReasons"
import type { Prisma } from "@/prisma/generated/prisma/client"

const lotOutputSelect = {
    orderBy: { jobOutput: { productSizeId: "asc" } },
    select: {
        plannedQuantity: true,
        goodQuantity: true,
        scrapQuantity: true,
        scraps: { orderBy: { quantity: "desc" }, select: { quantity: true, reason: { select: { id: true, code: true, name: true } } } },
        jobOutput: {
            select: {
                id: true,
                cavities: true,
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
} satisfies Prisma.ProductionLot$outputsArgs

const lotListSelect = {
    id: true,
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
    stops: { select: { durationMinutes: true } },
    job: {
        select: {
            id: true,
            lotBaseNumber: true,
            status: true,
            version: true,
            machine: { select: { id: true, code: true, name: true } },
            mold: { select: { id: true, code: true, name: true } },
        },
    },
    outputs: lotOutputSelect,
    operators: { orderBy: { operator: { lastName: "asc" } }, select: { operator: { select: operatorRefSelect } } },
    _count: { select: { notes: true } },
} satisfies Prisma.ProductionLotSelect

const lotDetailSelect = {
    ...lotListSelect,
    job: {
        select: {
            ...lotListSelect.job.select,
            setupStartAt: true,
            productionStartAt: true,
            plannedEndAt: true,
            plannedShots: true,
            cycleTimeSec: true,
            version: true,
            lots: {
                orderBy: { sequence: "asc" },
                select: { sequence: true, shiftDate: true, shiftCode: true, plannedStartAt: true, plannedEndAt: true, status: true, reportedAt: true },
            },
        },
    },
    reportedByUser: { select: { id: true, firstName: true, lastName: true } },
    stops: {
        orderBy: [{ startAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
        select: {
            id: true,
            durationMinutes: true,
            startAt: true,
            note: true,
            reason: { select: { id: true, code: true, name: true, stopCategory: true } },
        },
    },
    notes: {
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            category: true,
            body: true,
            createdAt: true,
            authorUserId: true,
            authorUser: { select: { id: true, firstName: true, lastName: true } },
            operator: { select: operatorRefSelect },
        },
    },
} satisfies Prisma.ProductionLotSelect

type LotListRecord = Prisma.ProductionLotGetPayload<{ select: typeof lotListSelect }>
type LotDetailRecord = Prisma.ProductionLotGetPayload<{ select: typeof lotDetailSelect }>

export type LotOutputDto = {
    jobOutputId: string
    /** "10.5.8" */
    sizeCode: string
    productName: string
    cavities: number
    plannedQuantity: number
    goodQuantity: number
    scrapQuantity: number
    /** Fire kırılımı; toplamı `scrapQuantity`'den azsa kalanı "belirtilmemiş". */
    scrapReasons: Array<{ reason: { id: string; code: string; name: string }; quantity: number }>
    order: { id: string; orderNumber: string; variantCode: string; quantity: number; dueDate: string | null } | null
}

export type LotListItemDto = {
    id: string
    lotNumber: string
    sequence: number
    shiftDate: string
    shiftCode: string
    plannedStartAt: Date
    plannedEndAt: Date
    plannedShots: number
    status: LotListRecord["status"]
    /** Vardiya raporu — `reportedAt` boşsa rapor girilmemiş. */
    actualStartAt: Date | null
    actualEndAt: Date | null
    actualShots: number | null
    reportedAt: Date | null
    stopMinutes: number
    job: {
        id: string
        lotBaseNumber: number
        status: LotListRecord["job"]["status"]
        /** İyimser kilit — lot başlatma / rapor isteğinde `expectedVersion`. */
        version: number
        machine: { id: string; code: string; name: string }
        mold: { id: string; code: string; name: string }
    }
    colorHex: string | null
    colorName: string | null
    outputs: LotOutputDto[]
    /** Lota özel / dondurulmuş ekip — boşsa ekip vardiya ekibinden türetilir (handler). */
    lotOperators: OperatorRefDto[]
    noteCount: number
}

export type LotNoteDto = {
    id: string
    category: ProductionLotNoteCategory
    body: string
    createdAt: Date
    authorUserId: string | null
    author: { id: string; firstName: string | null; lastName: string | null } | null
    operator: OperatorRefDto | null
}

export type LotDetailDto = Omit<LotListItemDto, "job"> & {
    job: LotListItemDto["job"] & {
        setupStartAt: Date
        productionStartAt: Date
        plannedEndAt: Date
        plannedShots: number
        cycleTimeSec: number
    }
    siblings: Array<{ lotNumber: string; sequence: number; shiftDate: string; shiftCode: string; plannedStartAt: Date; plannedEndAt: Date; status: LotListRecord["status"]; reportedAt: Date | null }>
    reportedBy: { id: string; firstName: string | null; lastName: string | null } | null
    stops: Array<{
        id: string
        durationMinutes: number
        startAt: Date | null
        note: string | null
        reason: { id: string; code: string; name: string; stopCategory: ProductionStopCategory | null }
    }>
    notes: LotNoteDto[]
}

/** Rapor / başlatma için dar okuma: iş durumu + sürümü, lotlar, çıktılar, mevcut raporun nedenleri. */
export type LotForReportDto = {
    id: string
    lotNumber: string
    sequence: number
    status: LotListRecord["status"]
    actualShots: number | null
    reportedAt: Date | null
    job: {
        id: string
        status: ProductionJobStatus
        version: number
        lotBaseNumber: number
        moldId: string
        lots: Array<{ id: string; sequence: number; status: LotListRecord["status"] }>
    }
    outputs: Array<{ lotOutputId: string; jobOutputId: string; cavities: number }>
    /** Mevcut raporda kullanılan nedenler (sonradan pasife alınmış olsalar da kalabilir). */
    usedReasonIds: string[]
}

type JobStatusWrite = { from: ProductionJobStatus; to: ProductionJobStatus } | null

export type StartLotWrite = {
    lotId: string
    jobId: string
    expectedVersion: number
    startedAt: Date
    jobStatus: JobStatusWrite
    userId: string | null
}

export type ReportLotWrite = {
    lotId: string
    jobId: string
    expectedVersion: number
    jobStatus: JobStatusWrite
    userId: string | null
    actualStartAt: Date
    actualEndAt: Date
    actualShots: number
    outputs: Array<{ lotOutputId: string; goodQuantity: number; scrapQuantity: number; scraps: Array<{ reasonId: string; quantity: number }> }>
    stops: Array<{ reasonId: string; durationMinutes: number; startAt: Date | null; note: string | null }>
    /** İlk raporda sıradaki planlı lot bu lotun bitişinde başlar; düzeltmede `null`. */
    nextLot: { id: string; startAt: Date } | null
    /** Kalıp sayacına eklenecek (düzeltmede fark; eksi olabilir). */
    moldShotDelta: { moldId: string; shots: number } | null
    /** "Vardiya devri" kategorisinde lot notu olur. */
    handoverNote: { body: string; operatorId: string | null } | null
}

export type LotListQuery = {
    page: number
    limit: number
    /** "YYYY-MM-DD" vardiya günü aralığı (iki uç dahil). */
    from?: string
    to?: string
    machineId?: string
    search?: string
}

/** Yazımlar için dar lot başvurusu. */
export type LotRefDto = {
    id: string
    lotNumber: string
    machineId: string
    shiftDate: string
    shiftCode: string
    lotOperatorIds: string[]
}

export interface IPrismaProductionLotRepository {
    listLots(query: LotListQuery): Promise<IPaginatedResult<LotListItemDto>>
    getLotDetail(lotNumber: string): Promise<LotDetailDto | null>
    getLotRef(lotNumber: string): Promise<LotRefDto | null>
    /** Lota özel ekibi TAM değiştirir (boş = vardiya ekibine dön) — tek dizi transaction'ı. */
    replaceLotOperators(lotId: string, operatorIds: string[]): Promise<void>
    createNote(input: { lotId: string; category: ProductionLotNoteCategory; body: string; authorUserId: string | null; operatorId: string | null }): Promise<LotNoteDto>
    getNote(id: string): Promise<{ id: string; lotId: string; authorUserId: string | null } | null>
    deleteNote(id: string): Promise<void>
    getLotForReport(lotNumber: string): Promise<LotForReportDto | null>
    /** Lotu başlatır (iş sürümü tutmazsa ya da lot artık planlı değilse `null`). */
    startLot(write: StartLotWrite): Promise<{ version: number } | null>
    /** Raporu yazar — tek DİZİ transaction'ı; iş sürümü tutmazsa hiçbir şey yazılmaz ve `null` döner. */
    reportLot(write: ReportLotWrite): Promise<{ version: number } | null>
}

function toLotOutput(output: LotListRecord["outputs"][number]): LotOutputDto {
    const { jobOutput } = output
    const order = jobOutput.productionOrder
    return {
        jobOutputId: jobOutput.id,
        sizeCode: buildProductSizeCode(jobOutput.moldOutput.productSize.product.code, jobOutput.moldOutput.productSize.code),
        productName: jobOutput.moldOutput.productSize.product.name,
        cavities: jobOutput.cavities,
        plannedQuantity: output.plannedQuantity,
        goodQuantity: output.goodQuantity,
        scrapQuantity: output.scrapQuantity,
        scrapReasons: output.scraps,
        order: order
            ? {
                id: order.id,
                orderNumber: formatProductionOrderNumber(order.orderNumber),
                variantCode: order.variantCode,
                quantity: order.quantity,
                dueDate: order.dueDate ? utcDateToDateKey(order.dueDate) : null,
            }
            : null,
    }
}

function toLotListItem(record: LotListRecord): LotListItemDto {
    const color = record.outputs.find((output) => output.jobOutput.productionOrder?.productVariant?.version.color)
        ?.jobOutput.productionOrder?.productVariant?.version.color ?? null
    return {
        id: record.id,
        lotNumber: formatLotNumber(record.job.lotBaseNumber, record.sequence),
        sequence: record.sequence,
        shiftDate: utcDateToDateKey(record.shiftDate),
        shiftCode: record.shiftCode,
        plannedStartAt: record.plannedStartAt,
        plannedEndAt: record.plannedEndAt,
        plannedShots: record.plannedShots,
        status: record.status,
        actualStartAt: record.actualStartAt,
        actualEndAt: record.actualEndAt,
        actualShots: record.actualShots,
        reportedAt: record.reportedAt,
        stopMinutes: record.stops.reduce((sum, stop) => sum + stop.durationMinutes, 0),
        job: {
            id: record.job.id,
            lotBaseNumber: record.job.lotBaseNumber,
            status: record.job.status,
            version: record.job.version,
            machine: record.job.machine,
            mold: record.job.mold,
        },
        colorHex: color?.hex ?? null,
        colorName: color?.name ?? null,
        outputs: record.outputs.map(toLotOutput),
        lotOperators: record.operators.map((entry) => entry.operator),
        noteCount: record._count.notes,
    }
}

function toLotNote(note: LotDetailRecord["notes"][number]): LotNoteDto {
    return {
        id: note.id,
        category: note.category,
        body: note.body,
        createdAt: note.createdAt,
        authorUserId: note.authorUserId,
        author: note.authorUser,
        operator: note.operator,
    }
}

/** Lot no ("1000-2") → kayıt süzgeci; biçim bozuksa `null`. */
function lotNumberWhere(lotNumber: string): Prisma.ProductionLotWhereInput | null {
    const ref = parseLotNumber(lotNumber)
    return ref ? { sequence: ref.sequence, job: { lotBaseNumber: ref.lotBaseNumber } } : null
}

/**
 * Arama: "1000-2" → o lot; yalnız rakam ("1005") → iş kökü YA DA emir no (ikisi de 1000'lerde);
 * "UE-1005" → emir no; aksi hâlde varyant kodu / ürün adı / makine / kalıp kodu içinde.
 */
function buildLotSearchWhere(search: string): Prisma.ProductionLotWhereInput {
    const needle = search.trim()
    const byLot = lotNumberWhere(needle)
    if (byLot) return byLot
    const orderNumber = parseProductionOrderNumber(needle)
    const byOrder: Prisma.ProductionLotWhereInput = { outputs: { some: { jobOutput: { productionOrder: { orderNumber: orderNumber ?? -1 } } } } }
    if (orderNumber !== null) {
        return /^\d+$/.test(needle) ? { OR: [{ job: { lotBaseNumber: orderNumber } }, byOrder] } : byOrder
    }
    return {
        OR: [
            { outputs: { some: { jobOutput: { productionOrder: { variantCode: { contains: needle, mode: "insensitive" } } } } } },
            { outputs: { some: { jobOutput: { moldOutput: { productSize: { product: { name: { contains: needle, mode: "insensitive" } } } } } } } },
            { job: { machine: { code: { contains: needle, mode: "insensitive" } } } },
            { job: { mold: { code: { contains: needle, mode: "insensitive" } } } },
        ],
    }
}

export const productionLotRepository = (): IPrismaProductionLotRepository => {
    const listLots = async ({ page, limit, from, to, machineId, search }: LotListQuery) => {
        const conditions: Prisma.ProductionLotWhereInput[] = []
        if (from || to) {
            conditions.push({
                shiftDate: {
                    ...(from ? { gte: dateKeyToUtcDate(from) } : {}),
                    ...(to ? { lte: dateKeyToUtcDate(to) } : {}),
                },
            })
        }
        if (machineId) conditions.push({ job: { machineId } })
        if (search?.trim()) conditions.push(buildLotSearchWhere(search))
        const where: Prisma.ProductionLotWhereInput = conditions.length > 0 ? { AND: conditions } : {}

        const [total, records] = await Promise.all([
            prisma.productionLot.count({ where }),
            prisma.productionLot.findMany({
                where,
                orderBy: [{ plannedStartAt: "asc" }, { sequence: "asc" }],
                skip: (page - 1) * limit,
                take: limit,
                select: lotListSelect,
            }),
        ])
        return buildPaginationResponse(records.map(toLotListItem), {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        })
    }

    const getLotDetail = async (lotNumber: string) => {
        const where = lotNumberWhere(lotNumber)
        if (!where) return null
        const record = await prisma.productionLot.findFirst({ where, select: lotDetailSelect })
        if (!record) return null
        const base = toLotListItem(record)
        return {
            ...base,
            job: {
                ...base.job,
                setupStartAt: record.job.setupStartAt,
                productionStartAt: record.job.productionStartAt,
                plannedEndAt: record.job.plannedEndAt,
                plannedShots: record.job.plannedShots,
                cycleTimeSec: record.job.cycleTimeSec,
                version: record.job.version,
            },
            siblings: record.job.lots.map((lot) => ({
                ...lot,
                lotNumber: formatLotNumber(record.job.lotBaseNumber, lot.sequence),
                shiftDate: utcDateToDateKey(lot.shiftDate),
            })),
            reportedBy: record.reportedByUser,
            stops: record.stops,
            notes: record.notes.map(toLotNote),
        }
    }

    const getLotRef = async (lotNumber: string) => {
        const where = lotNumberWhere(lotNumber)
        if (!where) return null
        const record = await prisma.productionLot.findFirst({
            where,
            select: {
                id: true,
                sequence: true,
                shiftDate: true,
                shiftCode: true,
                job: { select: { lotBaseNumber: true, machineId: true } },
                operators: { select: { operatorId: true } },
            },
        })
        if (!record) return null
        return {
            id: record.id,
            lotNumber: formatLotNumber(record.job.lotBaseNumber, record.sequence),
            machineId: record.job.machineId,
            shiftDate: utcDateToDateKey(record.shiftDate),
            shiftCode: record.shiftCode,
            lotOperatorIds: record.operators.map((entry) => entry.operatorId),
        }
    }

    const replaceLotOperators = async (lotId: string, operatorIds: string[]) => {
        await prisma.$transaction([
            prisma.productionLotOperator.deleteMany({ where: { lotId } }),
            prisma.productionLotOperator.createMany({ data: operatorIds.map((operatorId) => ({ lotId, operatorId })) }),
        ])
    }

    const createNote = async (input: { lotId: string; category: ProductionLotNoteCategory; body: string; authorUserId: string | null; operatorId: string | null }) => {
        const note = await prisma.productionLotNote.create({
            data: input,
            select: lotDetailSelect.notes.select,
        })
        return toLotNote(note)
    }

    const getNote = async (id: string) => {
        return prisma.productionLotNote.findUnique({ where: { id }, select: { id: true, lotId: true, authorUserId: true } })
    }

    const deleteNote = async (id: string) => {
        await prisma.productionLotNote.delete({ where: { id } })
    }

    const getLotForReport = async (lotNumber: string) => {
        const where = lotNumberWhere(lotNumber)
        if (!where) return null
        const record = await prisma.productionLot.findFirst({
            where,
            select: {
                id: true,
                sequence: true,
                status: true,
                actualShots: true,
                reportedAt: true,
                job: {
                    select: {
                        id: true,
                        status: true,
                        version: true,
                        lotBaseNumber: true,
                        moldId: true,
                        lots: { orderBy: { sequence: "asc" }, select: { id: true, sequence: true, status: true } },
                    },
                },
                outputs: { select: { id: true, jobOutputId: true, jobOutput: { select: { cavities: true } }, scraps: { select: { reasonId: true } } } },
                stops: { select: { reasonId: true } },
            },
        })
        if (!record) return null
        return {
            id: record.id,
            lotNumber: formatLotNumber(record.job.lotBaseNumber, record.sequence),
            sequence: record.sequence,
            status: record.status,
            actualShots: record.actualShots,
            reportedAt: record.reportedAt,
            job: record.job,
            outputs: record.outputs.map((output) => ({ lotOutputId: output.id, jobOutputId: output.jobOutputId, cavities: output.jobOutput.cavities })),
            usedReasonIds: [...new Set([
                ...record.outputs.flatMap((output) => output.scraps.map((scrap) => scrap.reasonId)),
                ...record.stops.map((stop) => stop.reasonId),
            ])],
        }
    }

    const jobVersionOp = (jobId: string, expectedVersion: number, jobStatus: JobStatusWrite) => prisma.productionJob.update({
        // `version` filtresi tutmazsa P2025 → transaction'ın tamamı geri alınır.
        where: { id: jobId, version: expectedVersion },
        data: { version: { increment: 1 }, ...(jobStatus ? { status: jobStatus.to } : {}) },
        select: { version: true },
    })

    const statusChangeOps = (jobId: string, jobStatus: JobStatusWrite, userId: string | null, occurredAt: Date) => (jobStatus
        ? [prisma.productionJobStatusChange.create({
            data: { jobId, fromStatus: jobStatus.from, toStatus: jobStatus.to, userId, occurredAt },
            select: { id: true },
        })]
        : [])

    const runOrNull = async (operations: Prisma.PrismaPromise<unknown>[]) => {
        try {
            const [job] = await prisma.$transaction(operations)
            return { version: (job as { version: number }).version }
        } catch (error) {
            if (isPrismaErrorCode(error, "P2025")) return null
            throw error
        }
    }

    const startLot = async (write: StartLotWrite) => runOrNull([
        jobVersionOp(write.jobId, write.expectedVersion, write.jobStatus),
        prisma.productionLot.update({
            where: { id: write.lotId, status: "PLANNED" },
            data: { status: "RUNNING", actualStartAt: write.startedAt },
            select: { id: true },
        }),
        ...statusChangeOps(write.jobId, write.jobStatus, write.userId, write.startedAt),
    ])

    const reportLot = async (write: ReportLotWrite) => runOrNull([
        jobVersionOp(write.jobId, write.expectedVersion, write.jobStatus),
        prisma.productionLot.update({
            where: { id: write.lotId },
            data: {
                status: "COMPLETED",
                actualStartAt: write.actualStartAt,
                actualEndAt: write.actualEndAt,
                actualShots: write.actualShots,
                reportedAt: new Date(),
                reportedByUserId: write.userId,
            },
            select: { id: true },
        }),
        ...write.outputs.map((output) => prisma.productionLotOutput.update({
            where: { id: output.lotOutputId, lotId: write.lotId },
            data: { goodQuantity: output.goodQuantity, scrapQuantity: output.scrapQuantity },
            select: { id: true },
        })),
        // Fire kırılımı ve duruşlar raporun tam değişimidir.
        prisma.productionLotScrap.deleteMany({ where: { lotOutput: { lotId: write.lotId } } }),
        prisma.productionLotScrap.createMany({
            data: write.outputs.flatMap((output) => output.scraps.map((scrap) => ({ lotOutputId: output.lotOutputId, ...scrap }))),
        }),
        prisma.productionStop.deleteMany({ where: { lotId: write.lotId } }),
        prisma.productionStop.createMany({
            data: write.stops.map((stop) => ({ ...stop, lotId: write.lotId, createdByUserId: write.userId })),
        }),
        ...(write.nextLot
            ? [prisma.productionLot.updateMany({
                where: { id: write.nextLot.id, status: "PLANNED" },
                data: { status: "RUNNING", actualStartAt: write.nextLot.startAt },
            })]
            : []),
        ...(write.moldShotDelta && write.moldShotDelta.shots !== 0
            ? [prisma.mold.update({
                where: { id: write.moldShotDelta.moldId },
                data: { totalShots: { increment: write.moldShotDelta.shots } },
                select: { id: true },
            })]
            : []),
        ...statusChangeOps(write.jobId, write.jobStatus, write.userId, new Date()),
        ...(write.handoverNote
            ? [prisma.productionLotNote.create({
                data: {
                    lotId: write.lotId,
                    category: "HANDOVER",
                    body: write.handoverNote.body,
                    authorUserId: write.userId,
                    operatorId: write.handoverNote.operatorId,
                },
                select: { id: true },
            })]
            : []),
    ])

    return {
        listLots,
        getLotDetail,
        getLotRef,
        replaceLotOperators,
        createNote,
        getNote,
        deleteNote,
        getLotForReport,
        startLot,
        reportLot,
    }
}
