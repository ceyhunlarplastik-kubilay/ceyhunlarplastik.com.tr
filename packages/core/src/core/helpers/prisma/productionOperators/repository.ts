import { prisma } from "@/core/db/prisma"
import { Prisma } from "@/prisma/generated/prisma/client"

const productionOperatorSelect = {
    id: true,
    firstName: true,
    lastName: true,
    employeeNo: true,
    phone: true,
    isActive: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.ProductionOperatorSelect

export type ProductionOperatorDto = Prisma.ProductionOperatorGetPayload<{ select: typeof productionOperatorSelect }>

export type ProductionOperatorWriteInput = {
    firstName: string
    lastName: string
    employeeNo: string | null
    phone: string | null
    isActive: boolean
    notes: string | null
}

export interface IPrismaProductionOperatorRepository {
    listOperators(): Promise<ProductionOperatorDto[]>
    getOperator(id: string): Promise<ProductionOperatorDto | null>
    createOperator(input: ProductionOperatorWriteInput): Promise<ProductionOperatorDto>
    updateOperator(id: string, input: Partial<ProductionOperatorWriteInput>): Promise<ProductionOperatorDto>
    deleteOperator(id: string): Promise<void>
    /** Silme engeli: vardiya ekibi, lot ekibi ve lot notu (hepsi Restrict). */
    countReferences(id: string): Promise<{ shiftAssignments: number; lotOperators: number; lotNotes: number }>
}

export const productionOperatorRepository = (): IPrismaProductionOperatorRepository => {
    const listOperators = async () => {
        return prisma.productionOperator.findMany({
            // Türkçe harf sırası istemcide (`localeCompare("tr")`) düzeltilir; burada kararlı bir ön sıra.
            orderBy: [{ isActive: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
            select: productionOperatorSelect,
        })
    }

    const getOperator = async (id: string) => {
        return prisma.productionOperator.findUnique({ where: { id }, select: productionOperatorSelect })
    }

    const createOperator = async (input: ProductionOperatorWriteInput) => {
        return prisma.productionOperator.create({ data: input, select: productionOperatorSelect })
    }

    const updateOperator = async (id: string, input: Partial<ProductionOperatorWriteInput>) => {
        return prisma.productionOperator.update({ where: { id }, data: input, select: productionOperatorSelect })
    }

    const deleteOperator = async (id: string) => {
        await prisma.productionOperator.delete({ where: { id } })
    }

    const countReferences = async (id: string) => {
        const record = await prisma.productionOperator.findUnique({
            where: { id },
            select: { _count: { select: { shiftAssignments: true, lotOperators: true, lotNotes: true } } },
        })
        return record?._count ?? { shiftAssignments: 0, lotOperators: 0, lotNotes: 0 }
    }

    return { listOperators, getOperator, createOperator, updateOperator, deleteOperator, countReferences }
}
