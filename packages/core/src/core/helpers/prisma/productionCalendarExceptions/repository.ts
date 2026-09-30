import { prisma } from "@/core/db/prisma"
import { dateKeyToUtcDate, utcDateToDateKey } from "@/core/helpers/production/productionCalendar"
import { Prisma } from "@/prisma/generated/prisma/client"
import type { ProductionCalendarExceptionKind } from "@/prisma/generated/prisma/client"

const calendarExceptionSelect = {
    id: true,
    date: true,
    kind: true,
    note: true,
    areaId: true,
    area: { select: { id: true, code: true, name: true } },
    machineId: true,
    machine: { select: { id: true, code: true, name: true } },
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.ProductionCalendarExceptionSelect

type CalendarExceptionRecord = Prisma.ProductionCalendarExceptionGetPayload<{ select: typeof calendarExceptionSelect }>

/** `date` "YYYY-MM-DD" olarak taşınır: `@db.Date` bir gün, bir an değil. */
export type CalendarExceptionDto = Omit<CalendarExceptionRecord, "date"> & { date: string }

/** Tek kayıt (aralık) — günlere açılmış hâliyle. Günlerin hepsi aynı tür, not ve kapsamı taşır. */
export type CalendarExceptionEntryWrite = {
    dates: string[]
    kind: ProductionCalendarExceptionKind
    note: string | null
    areaId: string | null
    machineId: string | null
}

function toCalendarExceptionDto({ date, ...record }: CalendarExceptionRecord): CalendarExceptionDto {
    return { ...record, date: utcDateToDateKey(date) }
}

export interface IPrismaProductionCalendarExceptionRepository {
    listExceptions(range: { from?: string; to?: string }): Promise<CalendarExceptionDto[]>
    findExistingIds(ids: string[]): Promise<Set<string>>
    /** Aynı kapsamda zaten kaydı olan günler (`excludeIds` düzenlenen kaydın kendi günleri). */
    findConflictingDateKeys(input: {
        dates: string[]
        areaId: string | null
        machineId: string | null
        excludeIds: string[]
    }): Promise<string[]>
    /** `removeIds`'i silip kaydın günlerini yazar — tek transaction; düzenleme de oluşturma da bu. */
    replaceEntry(input: CalendarExceptionEntryWrite & { removeIds: string[] }): Promise<CalendarExceptionDto[]>
    deleteExceptions(ids: string[]): Promise<number>
}

export const productionCalendarExceptionRepository = (): IPrismaProductionCalendarExceptionRepository => {
    const listExceptions = async ({ from, to }: { from?: string; to?: string }) => {
        const records = await prisma.productionCalendarException.findMany({
            where: from || to
                ? {
                    date: {
                        ...(from ? { gte: dateKeyToUtcDate(from) } : {}),
                        ...(to ? { lte: dateKeyToUtcDate(to) } : {}),
                    },
                }
                : undefined,
            orderBy: [{ date: "asc" }, { createdAt: "asc" }],
            select: calendarExceptionSelect,
        })
        return records.map(toCalendarExceptionDto)
    }

    const findExistingIds = async (ids: string[]) => {
        if (ids.length === 0) return new Set<string>()
        const rows = await prisma.productionCalendarException.findMany({
            where: { id: { in: ids } },
            select: { id: true },
        })
        return new Set(rows.map((row) => row.id))
    }

    const findConflictingDateKeys = async (input: {
        dates: string[]
        areaId: string | null
        machineId: string | null
        excludeIds: string[]
    }) => {
        if (input.dates.length === 0) return []
        const rows = await prisma.productionCalendarException.findMany({
            where: {
                date: { in: input.dates.map(dateKeyToUtcDate) },
                // `null` Prisma'da IS NULL'dur: fabrika kapsamı yalnız fabrika kayıtlarıyla çakışır.
                areaId: input.areaId,
                machineId: input.machineId,
                ...(input.excludeIds.length > 0 ? { id: { notIn: input.excludeIds } } : {}),
            },
            select: { date: true },
        })
        return rows.map((row) => utcDateToDateKey(row.date))
    }

    const replaceEntry = async ({ removeIds, dates, ...entry }: CalendarExceptionEntryWrite & { removeIds: string[] }) => {
        const days = dates.map((date) => ({ ...entry, date: dateKeyToUtcDate(date) }))

        // Yalnız yazmalar transaction'da (dizi biçimi: etkileşimli transaction'ın 5 sn sınırı yok).
        await prisma.$transaction([
            prisma.productionCalendarException.deleteMany({ where: { id: { in: removeIds } } }),
            prisma.productionCalendarException.createMany({ data: days }),
        ])

        const records = await prisma.productionCalendarException.findMany({
            where: { date: { in: days.map((day) => day.date) }, areaId: entry.areaId, machineId: entry.machineId },
            orderBy: { date: "asc" },
            select: calendarExceptionSelect,
        })
        return records.map(toCalendarExceptionDto)
    }

    const deleteExceptions = async (ids: string[]) => {
        if (ids.length === 0) return 0
        const result = await prisma.productionCalendarException.deleteMany({ where: { id: { in: ids } } })
        return result.count
    }

    return { listExceptions, findExistingIds, findConflictingDateKeys, replaceEntry, deleteExceptions }
}
