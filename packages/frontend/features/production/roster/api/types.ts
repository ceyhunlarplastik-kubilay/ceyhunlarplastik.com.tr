import type { CalendarExceptionKind } from "@core/helpers/production/productionCalendar"
import type { OperatorRef } from "@/features/production/lots/api/types"
import type { ProductionMachineStatus } from "@/features/production/shared/machineStatus"

/** `GET /production/shift-assignments?date` — makinelerin o günkü vardiyaları ve ekipleri. */
export type RosterShift = { code: string; name: string; startAt: string; endAt: string; operatorIds: string[] }

export type RosterMachine = {
    id: string
    code: string
    name: string
    status: ProductionMachineStatus
    area: { id: string; code: string; name: string }
    shiftPatternName: string | null
    exception: CalendarExceptionKind | null
    shifts: RosterShift[]
    /** O gün çalışılmayan hücrede kalmış atamalar (düzen / takvim sonradan değişmiş). */
    orphans: Array<{ shiftCode: string; operatorIds: string[] }>
}

export type RosterDay = { date: string; machines: RosterMachine[]; operators: OperatorRef[] }

export type RosterCellInput = { machineId: string; shiftDate: string; shiftCode: string; operatorIds: string[] }

export type RosterCopyInput = { fromDate: string; toStart: string; toEnd: string }
