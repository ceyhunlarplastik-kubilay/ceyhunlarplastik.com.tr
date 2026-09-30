import { prisma } from "@/core/db/prisma"
import { dateKeyToUtcDate, utcDateToDateKey } from "@/core/helpers/production/productionCalendar"
import type { RosterRow } from "@/core/helpers/production/shiftAssignments"
import type { Prisma } from "@/prisma/generated/prisma/client"

/** Ekip listelerinde operatörün dar görünümü (telefon / not gibi alanlar taşınmaz). */
export const operatorRefSelect = {
    id: true,
    firstName: true,
    lastName: true,
    employeeNo: true,
    isActive: true,
} satisfies Prisma.ProductionOperatorSelect

export type OperatorRefDto = Prisma.ProductionOperatorGetPayload<{ select: typeof operatorRefSelect }>

export type ShiftAssignmentDto = { machineId: string; shiftDate: string; shiftCode: string; operator: OperatorRefDto }

export type RosterCellRef = { machineId: string; shiftDate: string; shiftCode: string }

const assignmentSelect = {
    machineId: true,
    shiftDate: true,
    shiftCode: true,
    operator: { select: operatorRefSelect },
} satisfies Prisma.MachineShiftAssignmentSelect

type AssignmentRecord = Prisma.MachineShiftAssignmentGetPayload<{ select: typeof assignmentSelect }>

function toAssignmentDto(record: AssignmentRecord): ShiftAssignmentDto {
    return { ...record, shiftDate: utcDateToDateKey(record.shiftDate) }
}

const assignmentOrderBy: Prisma.MachineShiftAssignmentOrderByWithRelationInput[] = [
    { operator: { lastName: "asc" } },
    { operator: { firstName: "asc" } },
]

export interface IPrismaShiftAssignmentRepository {
    /** Verilen vardiya günlerinin tüm atamaları. */
    listForDates(dates: string[]): Promise<ShiftAssignmentDto[]>
    /** Belirli hücrelerin atamaları (lot ekibi türetme, tamamlamada dondurma). */
    listForCells(cells: RosterCellRef[]): Promise<ShiftAssignmentDto[]>
    /** Hücrenin ekibini TAM değiştirir (boş liste = hücreyi boşalt) — tek dizi transaction'ı. */
    replaceCell(cell: RosterCellRef, operatorIds: string[]): Promise<void>
    /** Kopyalama: hedef günlerin TÜM atamaları silinir, satırlar yazılır — tek dizi transaction'ı. */
    replaceDays(dates: string[], rows: RosterRow[]): Promise<number>
}

export const productionShiftAssignmentRepository = (): IPrismaShiftAssignmentRepository => {
    const listForDates = async (dates: string[]) => {
        if (dates.length === 0) return []
        const records = await prisma.machineShiftAssignment.findMany({
            where: { shiftDate: { in: dates.map(dateKeyToUtcDate) } },
            orderBy: assignmentOrderBy,
            select: assignmentSelect,
        })
        return records.map(toAssignmentDto)
    }

    const listForCells = async (cells: RosterCellRef[]) => {
        const unique = [...new Map(cells.map((cell) => [`${cell.machineId}|${cell.shiftDate}|${cell.shiftCode}`, cell])).values()]
        if (unique.length === 0) return []
        const records = await prisma.machineShiftAssignment.findMany({
            where: {
                OR: unique.map((cell) => ({
                    machineId: cell.machineId,
                    shiftDate: dateKeyToUtcDate(cell.shiftDate),
                    shiftCode: cell.shiftCode,
                })),
            },
            orderBy: assignmentOrderBy,
            select: assignmentSelect,
        })
        return records.map(toAssignmentDto)
    }

    const replaceCell = async (cell: RosterCellRef, operatorIds: string[]) => {
        const shiftDate = dateKeyToUtcDate(cell.shiftDate)
        await prisma.$transaction([
            prisma.machineShiftAssignment.deleteMany({ where: { machineId: cell.machineId, shiftDate, shiftCode: cell.shiftCode } }),
            prisma.machineShiftAssignment.createMany({
                data: operatorIds.map((operatorId) => ({ machineId: cell.machineId, shiftDate, shiftCode: cell.shiftCode, operatorId })),
            }),
        ])
    }

    const replaceDays = async (dates: string[], rows: RosterRow[]) => {
        const [, created] = await prisma.$transaction([
            prisma.machineShiftAssignment.deleteMany({ where: { shiftDate: { in: dates.map(dateKeyToUtcDate) } } }),
            prisma.machineShiftAssignment.createMany({
                data: rows.map((row) => ({ ...row, shiftDate: dateKeyToUtcDate(row.shiftDate) })),
                skipDuplicates: true,
            }),
        ])
        return created.count
    }

    return { listForDates, listForCells, replaceCell, replaceDays }
}
