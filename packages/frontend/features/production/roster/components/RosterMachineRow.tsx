"use client"

import { Plus, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MAX_OPERATORS_PER_SHIFT_CELL } from "@core/helpers/production/shiftAssignments"
import { formatProductionShortDateTime } from "@core/helpers/production/productionTime"
import type { OperatorRef } from "@/features/production/lots/api/types"
import type { RosterMachine, RosterShift } from "@/features/production/roster/api/types"
import { CALENDAR_EXCEPTION_KIND_LABELS } from "@/features/production/shared/calendarExceptionKinds"
import { OperatorMultiPicker } from "@/features/production/shared/components/OperatorMultiPicker"
import { MACHINE_STATUS_BADGE_CLASSES, MACHINE_STATUS_LABELS } from "@/features/production/shared/machineStatus"
import { formatOperatorShortName, formatOperatorName } from "@/features/production/shared/operators"

type Props = {
    machine: RosterMachine
    operators: OperatorRef[]
    /** Operatör kimliği → o gün kaç hücrede görevli (birden çoksa rozette gösterilir). */
    load: Map<string, number>
    isPending: boolean
    onChangeCell: (machine: RosterMachine, shiftCode: string, operatorIds: string[]) => void
}

const time = (value: string) => formatProductionShortDateTime(value).slice(6)

/** Bir makinenin o günkü vardiyaları: her hücrede ekip + seçici. Çalışılmayan gün / düzen dışı atama uyarısı. */
export function RosterMachineRow({ machine, operators, load, isPending, onChangeCell }: Props) {
    const byId = new Map(operators.map((operator) => [operator.id, operator]))

    return (
        <div className="grid gap-3 border-b px-4 py-3 last:border-b-0 md:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold">{machine.code}</span>
                    {machine.status !== "ACTIVE" ? (
                        <Badge variant="outline" className={cn("rounded-full px-1.5 py-0 text-[10px]", MACHINE_STATUS_BADGE_CLASSES[machine.status])}>
                            {MACHINE_STATUS_LABELS[machine.status]}
                        </Badge>
                    ) : null}
                </div>
                <p className="truncate text-xs text-muted-foreground" title={machine.name}>{machine.name}</p>
                <p className="text-xs text-muted-foreground">{machine.shiftPatternName ?? "Vardiya düzeni yok"}</p>
            </div>

            <div className="space-y-2">
                {machine.shifts.length === 0 ? (
                    <p className="rounded-xl border border-dashed px-3 py-2 text-sm text-muted-foreground">
                        {machine.exception && machine.exception !== "EXTRA_WORKDAY"
                            ? `${CALENDAR_EXCEPTION_KIND_LABELS[machine.exception]} — bu gün çalışılmıyor.`
                            : machine.shiftPatternName ? "Bu gün vardiya yok." : "Makineye ya da alanına vardiya düzeni seçilmemiş."}
                    </p>
                ) : (
                    <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(13rem,1fr))]">
                        {machine.shifts.map((shift) => (
                            <ShiftCell
                                key={shift.code}
                                machine={machine}
                                shift={shift}
                                operators={operators}
                                byId={byId}
                                load={load}
                                isPending={isPending}
                                onChangeCell={onChangeCell}
                            />
                        ))}
                    </div>
                )}
                {machine.orphans.map((orphan) => (
                    <div key={orphan.shiftCode} className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        <span>
                            {orphan.shiftCode} vardiyası bu gün çalışılmıyor ama atama kalmış:{" "}
                            {orphan.operatorIds.map((id) => byId.get(id)).filter(Boolean).map((operator) => formatOperatorName(operator as OperatorRef)).join(", ")}
                        </span>
                        <Button type="button" variant="outline" size="sm" className="ms-auto h-7" disabled={isPending} onClick={() => onChangeCell(machine, orphan.shiftCode, [])}>
                            Temizle
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ShiftCell({
    machine,
    shift,
    operators,
    byId,
    load,
    isPending,
    onChangeCell,
}: Omit<Props, "machine"> & { machine: RosterMachine; shift: RosterShift; byId: Map<string, OperatorRef> }) {
    const assigned = shift.operatorIds.map((id) => byId.get(id)).filter((operator): operator is OperatorRef => Boolean(operator))

    return (
        <div className={cn("space-y-2 rounded-xl border p-2.5", assigned.length === 0 && "border-dashed")}>
            <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold">{shift.code} · {shift.name}</span>
                <span className="tabular-nums text-muted-foreground">{time(shift.startAt)}–{time(shift.endAt)}</span>
            </div>
            <ul className="flex flex-wrap gap-1">
                {assigned.map((operator) => (
                    <li key={operator.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                        <span title={formatOperatorName(operator)}>{formatOperatorShortName(operator)}</span>
                        {(load.get(operator.id) ?? 0) > 1 ? <span className="text-muted-foreground" title="Bu gün birden çok makinede">×{load.get(operator.id)}</span> : null}
                        {!operator.isActive ? <span className="text-muted-foreground">(pasif)</span> : null}
                        <button
                            type="button"
                            className="rounded-full p-0.5 hover:bg-background disabled:opacity-50"
                            aria-label={`${formatOperatorName(operator)} çıkar`}
                            disabled={isPending}
                            onClick={() => onChangeCell(machine, shift.code, shift.operatorIds.filter((id) => id !== operator.id))}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </li>
                ))}
            </ul>
            <OperatorMultiPicker
                operators={operators}
                selectedIds={shift.operatorIds}
                max={MAX_OPERATORS_PER_SHIFT_CELL}
                title={`${machine.code} · ${shift.code}`}
                disabled={isPending}
                onApply={(ids) => onChangeCell(machine, shift.code, ids)}
                trigger={(
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-full justify-start text-xs" disabled={isPending}>
                        <Plus className="h-3.5 w-3.5" />
                        {assigned.length === 0 ? "Operatör ata" : "Ekibi düzenle"}
                    </Button>
                )}
            />
        </div>
    )
}
