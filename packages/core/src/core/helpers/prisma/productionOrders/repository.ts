import { prisma } from "@/core/db/prisma"
import type { IPaginatedResult } from "@/core/helpers/pagination/buildPaginationResponse"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import {
    customerDisplayName,
    moldOutputSummarySelect,
    productSizeLabelSelect,
    toMoldSummary,
    toProductSizeRef,
    toVariantVersion,
    usableMoldOutputWhere,
    variantVersionSelect,
    type MoldSummaryDto,
    type ProductSizeRefDto,
    type VariantVersionDto,
} from "@/core/helpers/prisma/productionReferences/repository"
import { dateKeyToUtcDate, utcDateToDateKey } from "@/core/helpers/production/productionCalendar"
import { formatLotNumber } from "@/core/helpers/production/jobPlan"
import { parseProductionOrderNumber } from "@/core/helpers/production/productionOrders"
import { Prisma } from "@/prisma/generated/prisma/client"
import type {
    ProductionOrderSource,
    ProductionOrderStatus,
    ProductionPriority,
} from "@/prisma/generated/prisma/client"

const productionOrderSelect = {
    id: true,
    orderNumber: true,
    productVariantId: true,
    variantCode: true,
    quantity: true,
    dueDate: true,
    priority: true,
    source: true,
    customerId: true,
    customer: { select: { id: true, companyName: true, fullName: true } },
    cycleTimeOverrideSec: true,
    status: true,
    notes: true,
    createdByUserId: true,
    createdByUser: { select: { id: true, firstName: true, lastName: true } },
    createdAt: true,
    updatedAt: true,
    productVariant: {
        select: {
            id: true,
            fullCode: true,
            product: { select: { id: true, code: true, name: true } },
            size: {
                select: {
                    ...productSizeLabelSelect,
                    moldOutputs: {
                        where: usableMoldOutputWhere,
                        orderBy: { mold: { code: "asc" } },
                        select: moldOutputSummarySelect,
                    },
                },
            },
            version: { select: variantVersionSelect },
            productionProfile: { select: { cycleTimeSec: true } },
        },
    },
    jobOutputs: {
        orderBy: { job: { setupStartAt: "asc" } },
        select: {
            plannedQuantity: true,
            job: {
                select: {
                    id: true,
                    lotBaseNumber: true,
                    status: true,
                    setupStartAt: true,
                    plannedEndAt: true,
                    machine: { select: { id: true, code: true, name: true } },
                    mold: { select: { id: true, code: true, name: true } },
                    lots: {
                        orderBy: { sequence: "asc" },
                        select: {
                            sequence: true,
                            shiftDate: true,
                            shiftCode: true,
                            plannedStartAt: true,
                            plannedEndAt: true,
                            plannedShots: true,
                            outputs: { select: { plannedQuantity: true, jobOutput: { select: { productionOrderId: true } } } },
                        },
                    },
                },
            },
        },
    },
} satisfies Prisma.ProductionOrderSelect

type ProductionOrderRecord = Prisma.ProductionOrderGetPayload<{ select: typeof productionOrderSelect }>

export type ProductionOrderJobDto = {
    id: string
    lotBaseNumber: number
    status: ProductionOrderRecord["jobOutputs"][number]["job"]["status"]
    machine: { id: string; code: string; name: string }
    mold: { id: string; code: string; name: string }
    setupStartAt: Date
    plannedEndAt: Date
    /** Bu emre düşen planlı adet (aile kalıbının yan ürünü hariç). */
    plannedQuantity: number
    lots: Array<{
        /** "1000-2" */
        lotNumber: string
        sequence: number
        /** "YYYY-MM-DD" (vardiya günü) */
        shiftDate: string
        shiftCode: string
        plannedStartAt: Date
        plannedEndAt: Date
        /** Bu emre düşen adet. */
        plannedQuantity: number
    }>
}

export type ProductionOrderDto = Omit<ProductionOrderRecord, "dueDate" | "customer" | "productVariant" | "jobOutputs"> & {
    jobs: ProductionOrderJobDto[]
    /** "YYYY-MM-DD" — termin günü. */
    dueDate: string | null
    customer: { id: string; name: string } | null
    /** Varyant katalogdan silinmişse `null`; kod `variantCode`'da kalır. */
    productVariant: {
        id: string
        fullCode: string
        product: { id: string; code: string; name: string }
        size: ProductSizeRefDto
        version: VariantVersionDto
        /** Varyanta özel çevrim (sn); girilmemişse `null`. */
        cycleTimeSec: number | null
        /** Ölçüyü basan, kullanım dışı olmayan kalıplar. */
        molds: MoldSummaryDto[]
    } | null
}

function toProductionOrderDto({ dueDate, customer, productVariant, jobOutputs, ...record }: ProductionOrderRecord): ProductionOrderDto {
    return {
        ...record,
        jobs: jobOutputs.map(({ plannedQuantity, job }) => ({
            id: job.id,
            lotBaseNumber: job.lotBaseNumber,
            status: job.status,
            machine: job.machine,
            mold: job.mold,
            setupStartAt: job.setupStartAt,
            plannedEndAt: job.plannedEndAt,
            plannedQuantity,
            lots: job.lots.map((lot) => ({
                lotNumber: formatLotNumber(job.lotBaseNumber, lot.sequence),
                sequence: lot.sequence,
                shiftDate: utcDateToDateKey(lot.shiftDate),
                shiftCode: lot.shiftCode,
                plannedStartAt: lot.plannedStartAt,
                plannedEndAt: lot.plannedEndAt,
                plannedQuantity: lot.outputs
                    .filter((output) => output.jobOutput.productionOrderId === record.id)
                    .reduce((sum, output) => sum + output.plannedQuantity, 0),
            })),
        })),
        dueDate: dueDate ? utcDateToDateKey(dueDate) : null,
        customer: customer ? { id: customer.id, name: customerDisplayName(customer) } : null,
        productVariant: productVariant
            ? {
                id: productVariant.id,
                fullCode: productVariant.fullCode,
                product: productVariant.product,
                size: toProductSizeRef(productVariant.product.code, productVariant.size),
                version: toVariantVersion(productVariant.version),
                cycleTimeSec: productVariant.productionProfile?.cycleTimeSec ?? null,
                molds: productVariant.size.moldOutputs.map(toMoldSummary),
            }
            : null,
    }
}

export type ProductionOrderWriteInput = {
    productVariantId: string
    variantCode: string
    quantity: number
    /** "YYYY-MM-DD" */
    dueDate: string | null
    priority: ProductionPriority
    source: ProductionOrderSource
    customerId: string | null
    cycleTimeOverrideSec: number | null
    status: ProductionOrderStatus
    notes: string | null
}

export type ProductionOrderListQuery = {
    page: number
    limit: number
    search?: string
    statuses?: ProductionOrderStatus[]
}

function toWriteData(input: Partial<ProductionOrderWriteInput>) {
    const { dueDate, ...rest } = input
    return {
        ...rest,
        ...(dueDate === undefined ? {} : { dueDate: dueDate === null ? null : dateKeyToUtcDate(dueDate) }),
    }
}

function buildSearchWhere(search: string): Prisma.ProductionOrderWhereInput {
    const orderNumber = parseProductionOrderNumber(search)
    if (orderNumber !== null) {
        // "1001" hem emir no hem kod parçası olabilir: ikisini de ara.
        return { OR: [{ orderNumber }, { variantCode: { contains: search.trim(), mode: "insensitive" } }] }
    }
    const needle = search.trim()
    return {
        OR: [
            { variantCode: { contains: needle, mode: "insensitive" } },
            { productVariant: { product: { name: { contains: needle, mode: "insensitive" } } } },
            { customer: { companyName: { contains: needle, mode: "insensitive" } } },
            { customer: { fullName: { contains: needle, mode: "insensitive" } } },
            { notes: { contains: needle, mode: "insensitive" } },
        ],
    }
}

export interface IPrismaProductionOrderRepository {
    listOrders(query: ProductionOrderListQuery): Promise<IPaginatedResult<ProductionOrderDto>>
    getOrder(id: string): Promise<ProductionOrderDto | null>
    createOrder(input: ProductionOrderWriteInput & { createdByUserId: string | null }): Promise<ProductionOrderDto>
    updateOrder(id: string, input: Partial<ProductionOrderWriteInput>): Promise<ProductionOrderDto>
    deleteOrder(id: string): Promise<void>
}

export const productionOrderRepository = (): IPrismaProductionOrderRepository => {
    const listOrders = async ({ page, limit, search, statuses }: ProductionOrderListQuery) => {
        const where: Prisma.ProductionOrderWhereInput = {
            ...(statuses && statuses.length > 0 ? { status: { in: statuses } } : {}),
            ...(search?.trim() ? buildSearchWhere(search) : {}),
        }
        const [total, records] = await Promise.all([
            prisma.productionOrder.count({ where }),
            prisma.productionOrder.findMany({
                where,
                // Planlayıcının bakacağı sıra: termini yakın olan önce (terminsiz sonda),
                // aynı günde acil olan önce (enum sırası LOW → URGENT), sonra emir no.
                orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }, { orderNumber: "asc" }],
                skip: (page - 1) * limit,
                take: limit,
                select: productionOrderSelect,
            }),
        ])
        return buildPaginationResponse(records.map(toProductionOrderDto), {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        })
    }

    const getOrder = async (id: string) => {
        const record = await prisma.productionOrder.findUnique({ where: { id }, select: productionOrderSelect })
        return record ? toProductionOrderDto(record) : null
    }

    const createOrder = async (input: ProductionOrderWriteInput & { createdByUserId: string | null }) => {
        const record = await prisma.productionOrder.create({ data: toWriteData(input) as Prisma.ProductionOrderUncheckedCreateInput, select: productionOrderSelect })
        return toProductionOrderDto(record)
    }

    const updateOrder = async (id: string, input: Partial<ProductionOrderWriteInput>) => {
        const record = await prisma.productionOrder.update({ where: { id }, data: toWriteData(input), select: productionOrderSelect })
        return toProductionOrderDto(record)
    }

    const deleteOrder = async (id: string) => {
        await prisma.productionOrder.delete({ where: { id } })
    }

    return { listOrders, getOrder, createOrder, updateOrder, deleteOrder }
}
