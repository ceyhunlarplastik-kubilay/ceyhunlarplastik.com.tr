import { prisma } from "@/core/db/prisma"
import { Prisma } from "@/prisma/generated/prisma/client"
import type { NormalizedShiftDefinition } from "@/core/helpers/production/shiftPatterns"

const shiftPatternSelect = {
    id: true,
    name: true,
    isDefault: true,
    timezone: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
    shifts: {
        orderBy: { sortOrder: "asc" },
        select: {
            id: true,
            code: true,
            name: true,
            startMinute: true,
            durationMinutes: true,
            daysOfWeek: true,
            sortOrder: true,
        },
    },
    _count: { select: { machines: true, areas: true } },
} satisfies Prisma.ShiftPatternSelect

type ShiftPatternRecord = Prisma.ShiftPatternGetPayload<{ select: typeof shiftPatternSelect }>

export type ShiftPatternDto = Omit<ShiftPatternRecord, "_count"> & {
    /** Düzeni doğrudan seçmiş makine / alan sayısı (varsayılan üzerinden kullananlar hariç). */
    machineCount: number
    areaCount: number
}

export type ShiftPatternWriteInput = {
    name: string
    isDefault: boolean
    notes: string | null
    shifts: NormalizedShiftDefinition[]
}

function toShiftPatternDto({ _count, ...record }: ShiftPatternRecord): ShiftPatternDto {
    return { ...record, machineCount: _count.machines, areaCount: _count.areas }
}

function toShiftRows(patternId: string, shifts: NormalizedShiftDefinition[]) {
    return shifts.map((shift) => ({
        patternId,
        code: shift.code,
        name: shift.name,
        startMinute: shift.startMinute,
        durationMinutes: shift.durationMinutes,
        daysOfWeek: shift.daysOfWeek,
        sortOrder: shift.sortOrder,
    }))
}

export interface IPrismaProductionShiftPatternRepository {
    listShiftPatterns(): Promise<ShiftPatternDto[]>
    getShiftPattern(id: string): Promise<ShiftPatternDto | null>
    /** Hiç varsayılan düzen yoksa ilk oluşturulan KENDİLİĞİNDEN varsayılan olur. */
    createShiftPattern(input: ShiftPatternWriteInput): Promise<ShiftPatternDto>
    /** Ad/not/varsayılan + vardiya listesinin TAM değişimi. */
    replaceShiftPattern(id: string, input: ShiftPatternWriteInput): Promise<ShiftPatternDto>
    deleteShiftPattern(id: string): Promise<void>
}

export const productionShiftPatternRepository = (): IPrismaProductionShiftPatternRepository => {
    const getShiftPattern = async (id: string) => {
        const record = await prisma.shiftPattern.findUnique({ where: { id }, select: shiftPatternSelect })
        return record ? toShiftPatternDto(record) : null
    }

    const getOrThrow = async (id: string) => {
        const pattern = await getShiftPattern(id)
        if (!pattern) throw new Error(`Shift pattern ${id} disappeared after write`)
        return pattern
    }

    const listShiftPatterns = async () => {
        const records = await prisma.shiftPattern.findMany({
            orderBy: [{ isDefault: "desc" }, { name: "asc" }],
            select: shiftPatternSelect,
        })
        return records.map(toShiftPatternDto)
    }

    // Transaction yalnız yazmaları içerir (CLAUDE.md: Neon'da 5 sn'lik interaktif
    // transaction sınırı); gösterim okuması işlem bittikten sonra yapılır.
    const createShiftPattern = async (input: ShiftPatternWriteInput) => {
        const created = await prisma.$transaction(async (tx) => {
            const defaultCount = await tx.shiftPattern.count({ where: { isDefault: true } })
            const isDefault = input.isDefault || defaultCount === 0

            if (isDefault && defaultCount > 0) {
                await tx.shiftPattern.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
            }

            const pattern = await tx.shiftPattern.create({
                data: { name: input.name, isDefault, notes: input.notes },
                select: { id: true },
            })
            await tx.shiftDefinition.createMany({ data: toShiftRows(pattern.id, input.shifts) })

            return pattern
        })

        return getOrThrow(created.id)
    }

    const replaceShiftPattern = async (id: string, input: ShiftPatternWriteInput) => {
        await prisma.$transaction(async (tx) => {
            if (input.isDefault) {
                await tx.shiftPattern.updateMany({
                    where: { isDefault: true, NOT: { id } },
                    data: { isDefault: false },
                })
            }

            await tx.shiftPattern.update({
                where: { id },
                data: { name: input.name, isDefault: input.isDefault, notes: input.notes },
            })
            await tx.shiftDefinition.deleteMany({ where: { patternId: id } })
            await tx.shiftDefinition.createMany({ data: toShiftRows(id, input.shifts) })
        })

        return getOrThrow(id)
    }

    const deleteShiftPattern = async (id: string) => {
        await prisma.shiftPattern.delete({ where: { id } })
    }

    return {
        listShiftPatterns,
        getShiftPattern,
        createShiftPattern,
        replaceShiftPattern,
        deleteShiftPattern,
    }
}
