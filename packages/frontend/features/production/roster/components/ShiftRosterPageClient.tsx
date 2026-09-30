"use client"

import { useMemo } from "react"
import { parseAsString, useQueryStates } from "nuqs"
import { ChevronLeft, ChevronRight, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { addDaysToDateKey, formatDateKey, isValidDateKey, weekdayOfDateKey } from "@core/helpers/production/productionCalendar"
import { productionDateKey } from "@core/helpers/production/productionTime"
import { weekdayShortLabel } from "@core/helpers/production/shiftPatterns"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import type { RosterMachine } from "@/features/production/roster/api/types"
import { useReplaceShiftCell, useShiftRoster } from "@/features/production/roster/hooks/useShiftRoster"
import { groupRosterByArea, operatorLoad, unassignedOperators } from "@/features/production/roster/utils/rosterView"
import { ProductionPageHeader } from "@/features/production/shared/components/ProductionPageHeader"
import { useNow } from "@/features/production/shared/hooks/useNow"
import { formatOperatorName } from "@/features/production/shared/operators"
import { CopyRosterDialog } from "./CopyRosterDialog"
import { RosterMachineRow } from "./RosterMachineRow"

const ALL_AREAS = "__all__"

/**
 * Vardiya ekibi: seçilen gün, her makinenin o günkü vardiyaları (hücre) ve operatörleri. Lotlar
 * ekibini buradan alır (makine × vardiya günü × vardiya). Gün ve alan URL'de.
 */
export function ShiftRosterPageClient() {
    const [{ gun, alan }, setState] = useQueryStates({ gun: parseAsString, alan: parseAsString.withDefault("") })
    const today = productionDateKey(useNow())
    const date = gun && isValidDateKey(gun) ? gun : today

    const rosterQuery = useShiftRoster(date)
    const mutation = useReplaceShiftCell()
    const day = rosterQuery.data
    const isInitialLoading = rosterQuery.isLoading && !day
    const isBackgroundRefetch = rosterQuery.isFetching && !isInitialLoading

    const areas = useMemo(() => groupRosterByArea(day?.machines ?? []).map((group) => group.area), [day])
    const groups = useMemo(() => groupRosterByArea(day?.machines ?? [], alan || null), [day, alan])
    const load = useMemo(() => operatorLoad(day ?? { machines: [] }), [day])
    const idle = useMemo(() => (day ? unassignedOperators(day) : []), [day])

    async function changeCell(machine: RosterMachine, shiftCode: string, operatorIds: string[]) {
        try {
            await mutation.mutateAsync({ machineId: machine.id, shiftDate: date, shiftCode, operatorIds })
            toast.success(`${machine.code} · ${shiftCode} ekibi güncellendi`)
        } catch {
            // Hata mesajı (çalışılmayan vardiya, pasif operatör) global axios interceptor'ında.
        }
    }

    return (
        <div className="space-y-6">
            <ProductionPageHeader
                icon={<Users />}
                title="Vardiya Ekibi"
                description="Hangi operatör hangi gün, hangi vardiyada, hangi makinede. Lotlar ekibini buradan alır; bir operatör aynı vardiyada birden çok makineye bakabilir."
                action={day ? <CopyRosterDialog fromDate={date} /> : null}
            />

            <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="icon" aria-label="Önceki gün" onClick={() => void setState({ gun: addDaysToDateKey(date, -1) })}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" disabled={date === today} onClick={() => void setState({ gun: null })}>Bugün</Button>
                <Button type="button" variant="outline" size="icon" aria-label="Sonraki gün" onClick={() => void setState({ gun: addDaysToDateKey(date, 1) })}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Input
                    type="date"
                    value={date}
                    onChange={(event) => { if (isValidDateKey(event.target.value)) void setState({ gun: event.target.value === today ? null : event.target.value }) }}
                    aria-label="Gün"
                    className="w-40"
                />
                <span className="text-sm font-medium">{formatDateKey(date)} {weekdayShortLabel(weekdayOfDateKey(date))}</span>
                {areas.length > 1 ? (
                    <Select value={alan || ALL_AREAS} onValueChange={(value) => void setState({ alan: value === ALL_AREAS ? null : value })}>
                        <SelectTrigger className="w-48 sm:ms-auto" aria-label="Alana göre süz">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_AREAS}>Tüm alanlar</SelectItem>
                            {areas.map((area) => <SelectItem key={area.id} value={area.id}>{area.code} · {area.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                ) : null}
            </div>

            {isInitialLoading ? (
                <Skeleton className="h-96 rounded-2xl" />
            ) : !day || day.machines.length === 0 ? (
                <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">Tanımlı (pasif olmayan) makine yok.</p>
            ) : (
                <>
                    <div className="relative space-y-4" aria-busy={isBackgroundRefetch || mutation.isPending}>
                        <AdminSectionLoadingOverlay isVisible={isBackgroundRefetch} />
                        {groups.map((group) => (
                            <section key={group.area.id} className="overflow-hidden rounded-2xl border bg-card" aria-label={`${group.area.code} · ${group.area.name}`}>
                                <h2 className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold tracking-wide">{group.area.code} · {group.area.name}</h2>
                                {group.machines.map((machine) => (
                                    <RosterMachineRow
                                        key={machine.id}
                                        machine={machine}
                                        operators={day.operators}
                                        load={load}
                                        isPending={mutation.isPending}
                                        onChangeCell={(target, code, ids) => void changeCell(target, code, ids)}
                                    />
                                ))}
                            </section>
                        ))}
                    </div>
                    <section className="space-y-2 rounded-2xl border p-4">
                        <h2 className="text-sm font-semibold">Bu gün görevsiz aktif operatörler <span className="font-normal text-muted-foreground">({idle.length})</span></h2>
                        {idle.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Tüm aktif operatörlerin bu gün görevi var.</p>
                        ) : (
                            <p className="text-sm">{idle.map(formatOperatorName).join(", ")}</p>
                        )}
                    </section>
                </>
            )}
        </div>
    )
}
