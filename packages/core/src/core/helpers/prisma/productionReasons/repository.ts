import { prisma } from "@/core/db/prisma"
import type { ProductionReasonKind, ProductionStopCategory } from "@/core/helpers/production/productionReasons"
import type { Prisma } from "@/prisma/generated/prisma/client"

const reasonSelect = {
    id: true,
    kind: true,
    code: true,
    name: true,
    stopCategory: true,
    isActive: true,
    sortOrder: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { stops: true, scraps: true } },
} satisfies Prisma.ProductionReasonSelect

type ReasonRecord = Prisma.ProductionReasonGetPayload<{ select: typeof reasonSelect }>

/** `usageCount`: bu nedene bağlı duruş + fire kaydı — sıfırdan büyükse silinmez, pasife alınır. */
export type ProductionReasonDto = Omit<ReasonRecord, "_count"> & { usageCount: number }

export type ProductionReasonWriteInput = {
    kind: ProductionReasonKind
    code: string
    name: string
    stopCategory: ProductionStopCategory | null
    isActive: boolean
    sortOrder: number
}

export interface IPrismaProductionReasonRepository {
    listReasons(): Promise<ProductionReasonDto[]>
    getReason(id: string): Promise<ProductionReasonDto | null>
    /** Aynı tür + kod başka kayıtta var mı (`excludeId` düzenlenen kayıt). */
    codeTaken(kind: ProductionReasonKind, code: string, excludeId?: string): Promise<boolean>
    createReason(input: ProductionReasonWriteInput): Promise<ProductionReasonDto>
    updateReason(id: string, input: Partial<ProductionReasonWriteInput>): Promise<ProductionReasonDto>
    deleteReason(id: string): Promise<void>
    /** Varsayılanlar — var olan (tür + kod) atlanır. */
    createMany(inputs: ProductionReasonWriteInput[]): Promise<number>
}

function toReasonDto({ _count, ...record }: ReasonRecord): ProductionReasonDto {
    return { ...record, usageCount: _count.stops + _count.scraps }
}

export const productionReasonRepository = (): IPrismaProductionReasonRepository => {
    const listReasons = async () => {
        const records = await prisma.productionReason.findMany({
            orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { code: "asc" }],
            select: reasonSelect,
        })
        return records.map(toReasonDto)
    }

    const getReason = async (id: string) => {
        const record = await prisma.productionReason.findUnique({ where: { id }, select: reasonSelect })
        return record ? toReasonDto(record) : null
    }

    const codeTaken = async (kind: ProductionReasonKind, code: string, excludeId?: string) => {
        const record = await prisma.productionReason.findFirst({
            where: { kind, code, ...(excludeId ? { id: { not: excludeId } } : {}) },
            select: { id: true },
        })
        return Boolean(record)
    }

    const createReason = async (input: ProductionReasonWriteInput) => {
        return toReasonDto(await prisma.productionReason.create({ data: input, select: reasonSelect }))
    }

    const updateReason = async (id: string, input: Partial<ProductionReasonWriteInput>) => {
        return toReasonDto(await prisma.productionReason.update({ where: { id }, data: input, select: reasonSelect }))
    }

    const deleteReason = async (id: string) => {
        await prisma.productionReason.delete({ where: { id } })
    }

    const createMany = async (inputs: ProductionReasonWriteInput[]) => {
        const result = await prisma.productionReason.createMany({ data: inputs, skipDuplicates: true })
        return result.count
    }

    return { listReasons, getReason, codeTaken, createReason, updateReason, deleteReason, createMany }
}
