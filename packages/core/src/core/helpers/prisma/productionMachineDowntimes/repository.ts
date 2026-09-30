import { prisma } from "@/core/db/prisma"
import { Prisma } from "@/prisma/generated/prisma/client"
import type { MachineDowntimeKind } from "@/prisma/generated/prisma/client"

const machineDowntimeSelect = {
    id: true,
    machineId: true,
    machine: { select: { id: true, code: true, name: true } },
    startAt: true,
    endAt: true,
    kind: true,
    reason: true,
    createdByUserId: true,
    // Kimin girdiği yalnız adıyla — e-posta vb. yanıta çıkmaz.
    createdByUser: { select: { id: true, firstName: true, lastName: true } },
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.MachineDowntimeSelect

export type MachineDowntimeDto = Prisma.MachineDowntimeGetPayload<{ select: typeof machineDowntimeSelect }>

export type MachineDowntimeWriteInput = {
    machineId: string
    startAt: Date
    endAt: Date
    kind: MachineDowntimeKind
    reason: string | null
}

export interface IPrismaProductionMachineDowntimeRepository {
    /** `from`/`to` bir pencere: o pencereyle KESİŞEN duruşlar döner. */
    listDowntimes(filter: { machineId?: string; from?: Date; to?: Date }): Promise<MachineDowntimeDto[]>
    getDowntime(id: string): Promise<MachineDowntimeDto | null>
    /** Aynı makinede aralıkla kesişen ilk duruş (yarı açık aralık; `excludeId` düzenlenen kayıt). */
    findOverlappingDowntime(input: {
        machineId: string
        startAt: Date
        endAt: Date
        excludeId?: string
    }): Promise<MachineDowntimeDto | null>
    createDowntime(input: MachineDowntimeWriteInput & { createdByUserId: string | null }): Promise<MachineDowntimeDto>
    updateDowntime(id: string, input: Partial<MachineDowntimeWriteInput>): Promise<MachineDowntimeDto>
    deleteDowntime(id: string): Promise<void>
}

export const productionMachineDowntimeRepository = (): IPrismaProductionMachineDowntimeRepository => {
    const listDowntimes = async ({ machineId, from, to }: { machineId?: string; from?: Date; to?: Date }) => {
        return prisma.machineDowntime.findMany({
            where: {
                ...(machineId ? { machineId } : {}),
                ...(from ? { endAt: { gt: from } } : {}),
                ...(to ? { startAt: { lt: to } } : {}),
            },
            orderBy: [{ startAt: "asc" }, { machine: { code: "asc" } }],
            select: machineDowntimeSelect,
        })
    }

    const getDowntime = async (id: string) => {
        return prisma.machineDowntime.findUnique({ where: { id }, select: machineDowntimeSelect })
    }

    const findOverlappingDowntime = async (input: {
        machineId: string
        startAt: Date
        endAt: Date
        excludeId?: string
    }) => {
        return prisma.machineDowntime.findFirst({
            where: {
                machineId: input.machineId,
                startAt: { lt: input.endAt },
                endAt: { gt: input.startAt },
                ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
            },
            orderBy: { startAt: "asc" },
            select: machineDowntimeSelect,
        })
    }

    const createDowntime = async (input: MachineDowntimeWriteInput & { createdByUserId: string | null }) => {
        return prisma.machineDowntime.create({ data: input, select: machineDowntimeSelect })
    }

    const updateDowntime = async (id: string, input: Partial<MachineDowntimeWriteInput>) => {
        return prisma.machineDowntime.update({ where: { id }, data: input, select: machineDowntimeSelect })
    }

    const deleteDowntime = async (id: string) => {
        await prisma.machineDowntime.delete({ where: { id } })
    }

    return { listDowntimes, getDowntime, findOverlappingDowntime, createDowntime, updateDowntime, deleteDowntime }
}
