import { prisma } from "@/core/db/prisma"
import { Prisma } from "@/prisma/generated/prisma/client"
import type { ProductionMachineStatus } from "@/prisma/generated/prisma/client"

const productionMachineSelect = {
    id: true,
    code: true,
    name: true,
    brand: true,
    model: true,
    serialNumber: true,
    manufactureYear: true,
    areaId: true,
    area: { select: { id: true, code: true, name: true } },
    status: true,
    clampForceTon: true,
    tieBarHorizontalMm: true,
    tieBarVerticalMm: true,
    minMoldHeightMm: true,
    maxMoldHeightMm: true,
    maxOpeningStrokeMm: true,
    maxDaylightMm: true,
    shotCapacityG: true,
    screwDiameterMm: true,
    locatingRingDiameterMm: true,
    hotRunnerZones: true,
    coreCircuits: true,
    hasRobot: true,
    plannedEfficiencyPercent: true,
    hourlyCost: true,
    currency: true,
    shiftPatternId: true,
    shiftPattern: { select: { id: true, name: true } },
    sortOrder: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.ProductionMachineSelect

type ProductionMachineRecord = Prisma.ProductionMachineGetPayload<{ select: typeof productionMachineSelect }>

/** `hourlyCost` Decimal → number: Prisma Decimal JSON'da `{s,e,d}` nesnesi olur. */
export type ProductionMachineDto = Omit<ProductionMachineRecord, "hourlyCost"> & {
    hourlyCost: number | null
}

export type ProductionMachineWriteInput = {
    code: string
    name: string
    brand: string | null
    model: string | null
    serialNumber: string | null
    manufactureYear: number | null
    areaId: string
    status: ProductionMachineStatus
    clampForceTon: number
    tieBarHorizontalMm: number | null
    tieBarVerticalMm: number | null
    minMoldHeightMm: number | null
    maxMoldHeightMm: number | null
    maxOpeningStrokeMm: number | null
    maxDaylightMm: number | null
    shotCapacityG: number | null
    screwDiameterMm: number | null
    locatingRingDiameterMm: number | null
    hotRunnerZones: number
    coreCircuits: number
    hasRobot: boolean
    plannedEfficiencyPercent: number
    hourlyCost: number | null
    shiftPatternId: string | null
    sortOrder: number
    notes: string | null
}

function toProductionMachineDto({ hourlyCost, ...record }: ProductionMachineRecord): ProductionMachineDto {
    return { ...record, hourlyCost: hourlyCost === null ? null : hourlyCost.toNumber() }
}

export interface IPrismaProductionMachineRepository {
    listMachines(): Promise<ProductionMachineDto[]>
    getMachine(id: string): Promise<ProductionMachineDto | null>
    createMachine(input: ProductionMachineWriteInput): Promise<ProductionMachineDto>
    updateMachine(id: string, input: Partial<ProductionMachineWriteInput>): Promise<ProductionMachineDto>
    deleteMachine(id: string): Promise<void>
    /** Var olan makine id'leri — kalıp-makine kartı yazmadan önce toplu kontrol. */
    findExistingMachineIds(ids: string[]): Promise<Set<string>>
    /** Makineye planlanmış iş sayısı (silme koruması). */
    countJobs(machineId: string): Promise<number>
}

export const productionMachineRepository = (): IPrismaProductionMachineRepository => {
    const listMachines = async () => {
        const records = await prisma.productionMachine.findMany({
            // Tahtadaki satır sırası: alan → alan içi sıra → kod.
            orderBy: [{ area: { sortOrder: "asc" } }, { sortOrder: "asc" }, { code: "asc" }],
            select: productionMachineSelect,
        })
        return records.map(toProductionMachineDto)
    }

    const getMachine = async (id: string) => {
        const record = await prisma.productionMachine.findUnique({ where: { id }, select: productionMachineSelect })
        return record ? toProductionMachineDto(record) : null
    }

    const createMachine = async (input: ProductionMachineWriteInput) => {
        const record = await prisma.productionMachine.create({ data: input, select: productionMachineSelect })
        return toProductionMachineDto(record)
    }

    const updateMachine = async (id: string, input: Partial<ProductionMachineWriteInput>) => {
        const record = await prisma.productionMachine.update({
            where: { id },
            data: input,
            select: productionMachineSelect,
        })
        return toProductionMachineDto(record)
    }

    const deleteMachine = async (id: string) => {
        await prisma.productionMachine.delete({ where: { id } })
    }

    const findExistingMachineIds = async (ids: string[]) => {
        if (ids.length === 0) return new Set<string>()
        const rows = await prisma.productionMachine.findMany({ where: { id: { in: ids } }, select: { id: true } })
        return new Set(rows.map((row) => row.id))
    }

    const countJobs = async (machineId: string) => prisma.productionJob.count({ where: { machineId } })

    return { listMachines, getMachine, createMachine, updateMachine, deleteMachine, findExistingMachineIds, countJobs }
}
