import type { OperatorRef } from "@/features/production/lots/api/types"
import type { RosterDay, RosterMachine } from "@/features/production/roster/api/types"
import { sortOperators } from "@/features/production/shared/operators"

export type RosterAreaGroup = { area: RosterMachine["area"]; machines: RosterMachine[] }

/** Sunucunun alan sırasını koruyarak gruplar; `areaId` verilirse süzer. */
export function groupRosterByArea(machines: RosterMachine[], areaId?: string | null): RosterAreaGroup[] {
    const groups: RosterAreaGroup[] = []
    for (const machine of machines) {
        if (areaId && machine.area.id !== areaId) continue
        const last = groups[groups.length - 1]
        if (last && last.area.id === machine.area.id) last.machines.push(machine)
        else groups.push({ area: machine.area, machines: [machine] })
    }
    return groups
}

/** O gün hiçbir makinede görevi olmayan AKTİF operatörler. */
export function unassignedOperators(day: Pick<RosterDay, "machines" | "operators">): OperatorRef[] {
    const assigned = new Set(day.machines.flatMap((machine) => machine.shifts.flatMap((shift) => shift.operatorIds)))
    return sortOperators(day.operators.filter((operator) => operator.isActive && !assigned.has(operator.id)))
}

/** Bir operatörün o günkü görev sayısı (birden çok makineye bakabilir — bilgi amaçlı). */
export function operatorLoad(day: Pick<RosterDay, "machines">): Map<string, number> {
    const load = new Map<string, number>()
    for (const machine of day.machines) {
        for (const shift of machine.shifts) {
            for (const id of shift.operatorIds) load.set(id, (load.get(id) ?? 0) + 1)
        }
    }
    return load
}
