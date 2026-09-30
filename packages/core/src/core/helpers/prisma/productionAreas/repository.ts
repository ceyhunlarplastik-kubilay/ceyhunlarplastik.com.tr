import { prisma } from "@/core/db/prisma"
import { Prisma } from "@/prisma/generated/prisma/client"

const productionAreaSelect = {
    id: true,
    code: true,
    name: true,
    sortOrder: true,
    isActive: true,
    notes: true,
    shiftPatternId: true,
    shiftPattern: { select: { id: true, name: true } },
    createdAt: true,
    updatedAt: true,
    _count: { select: { machines: true } },
} satisfies Prisma.ProductionAreaSelect

type ProductionAreaRecord = Prisma.ProductionAreaGetPayload<{ select: typeof productionAreaSelect }>

export type ProductionAreaDto = Omit<ProductionAreaRecord, "_count"> & {
    machineCount: number
}

export type ProductionAreaWriteInput = {
    code: string
    name: string
    sortOrder: number
    isActive: boolean
    notes: string | null
    shiftPatternId: string | null
}

function toProductionAreaDto({ _count, ...record }: ProductionAreaRecord): ProductionAreaDto {
    return { ...record, machineCount: _count.machines }
}

export interface IPrismaProductionAreaRepository {
    listAreas(): Promise<ProductionAreaDto[]>
    getArea(id: string): Promise<ProductionAreaDto | null>
    createArea(input: ProductionAreaWriteInput): Promise<ProductionAreaDto>
    updateArea(id: string, input: Partial<ProductionAreaWriteInput>): Promise<ProductionAreaDto>
    deleteArea(id: string): Promise<void>
}

export const productionAreaRepository = (): IPrismaProductionAreaRepository => {
    const listAreas = async () => {
        const records = await prisma.productionArea.findMany({
            orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
            select: productionAreaSelect,
        })
        return records.map(toProductionAreaDto)
    }

    const getArea = async (id: string) => {
        const record = await prisma.productionArea.findUnique({ where: { id }, select: productionAreaSelect })
        return record ? toProductionAreaDto(record) : null
    }

    const createArea = async (input: ProductionAreaWriteInput) => {
        const record = await prisma.productionArea.create({ data: input, select: productionAreaSelect })
        return toProductionAreaDto(record)
    }

    const updateArea = async (id: string, input: Partial<ProductionAreaWriteInput>) => {
        const record = await prisma.productionArea.update({
            where: { id },
            data: input,
            select: productionAreaSelect,
        })
        return toProductionAreaDto(record)
    }

    const deleteArea = async (id: string) => {
        await prisma.productionArea.delete({ where: { id } })
    }

    return { listAreas, getArea, createArea, updateArea, deleteArea }
}
