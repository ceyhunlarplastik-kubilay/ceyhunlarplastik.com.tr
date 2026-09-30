"use client"

import { AlertTriangle, ChevronLeft, ChevronRight, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDaysToDateKey, formatDateKeyRange, isValidDateKey } from "@core/helpers/production/productionCalendar"
import type { PlacementMode } from "@/features/production/board/api/types"
import { BOARD_WINDOW_OPTIONS } from "@/features/production/board/utils/boardGeometry"
import { PLACEMENT_MODE_OPTIONS } from "@/features/production/board/utils/placementMessage"
import { ACTUAL_LINE_CLASS, DOWNTIME_PATTERN_CLASS, OFF_SHIFT_CLASS, PROJECTED_DELAY_CLASS } from "./boardStyles"

const ALL_AREAS = "__all__"

type Props = {
    from: string
    to: string
    today: string
    days: number
    areaId: string
    areas: Array<{ id: string; code: string; name: string }>
    onFromChange: (from: string) => void
    onDaysChange: (days: number) => void
    onAreaChange: (areaId: string) => void
    placementMode: PlacementMode
    onPlacementModeChange: (mode: PlacementMode) => void
}

/** Pencere gezintisi (önceki / bugün / sonraki / tarih), pencere uzunluğu, alan süzgeci, lejant. */
export function ProductionBoardToolbar({
    from,
    to,
    today,
    days,
    areaId,
    areas,
    onFromChange,
    onDaysChange,
    onAreaChange,
    placementMode,
    onPlacementModeChange,
}: Props) {
    const placementHint = PLACEMENT_MODE_OPTIONS.find((option) => option.value === placementMode)?.hint
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                    <Button type="button" variant="outline" size="icon" aria-label="Önceki pencere" onClick={() => onFromChange(addDaysToDateKey(from, -days))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" onClick={() => onFromChange(today)} disabled={from === today}>
                        Bugün
                    </Button>
                    <Button type="button" variant="outline" size="icon" aria-label="Sonraki pencere" onClick={() => onFromChange(addDaysToDateKey(from, days))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <Input
                    type="date"
                    value={from}
                    onChange={(event) => { if (isValidDateKey(event.target.value)) onFromChange(event.target.value) }}
                    aria-label="Pencere başlangıcı"
                    className="w-40"
                />
                <Select value={String(days)} onValueChange={(value) => onDaysChange(Number(value))}>
                    <SelectTrigger className="w-32" aria-label="Pencere uzunluğu">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {BOARD_WINDOW_OPTIONS.map((option) => (
                            <SelectItem key={option} value={String(option)}>{option} gün</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {areas.length > 1 ? (
                    <Select value={areaId || ALL_AREAS} onValueChange={(value) => onAreaChange(value === ALL_AREAS ? "" : value)}>
                        <SelectTrigger className="w-48" aria-label="Alana göre süz">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_AREAS}>Tüm alanlar</SelectItem>
                            {areas.map((area) => (
                                <SelectItem key={area.id} value={area.id}>{area.code} · {area.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : null}
                <Select value={placementMode} onValueChange={(value) => onPlacementModeChange(value as PlacementMode)}>
                    <SelectTrigger className="w-48" aria-label="Çakışmada" title={placementHint}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PLACEMENT_MODE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>Çakışmada: {option.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground tabular-nums sm:ms-auto">{formatDateKeyRange(from, to)}</span>
            </div>

            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Lejant">
                <li className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm border border-sky-400 bg-sky-200 dark:bg-sky-900/70" />Planlı iş (lot)</li>
                <li className="flex items-center gap-1.5"><span className="h-3 w-5 rounded-sm border border-dashed border-sky-400" />Kalıp bağlama</li>
                <li className="flex items-center gap-1.5"><span className={`h-3 w-5 rounded-sm ${OFF_SHIFT_CLASS}`} />Vardiya dışı</li>
                <li className="flex items-center gap-1.5"><span className={`h-3 w-5 rounded-sm ${DOWNTIME_PATTERN_CLASS}`} />Duruş</li>
                <li className="flex items-center gap-1.5">
                    <span className="relative h-3 w-5 rounded-sm border border-emerald-500 bg-emerald-200 dark:bg-emerald-900/70">
                        <span className={`absolute inset-x-0.5 bottom-0.5 h-0.5 ${ACTUAL_LINE_CLASS}`} />
                    </span>
                    Gerçekleşen (rapor)
                </li>
                <li className="flex items-center gap-1.5"><span className={`h-3 w-5 rounded-sm ${PROJECTED_DELAY_CLASS}`} />Tahmini gecikme</li>
                <li className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" aria-hidden />Gecikme / termin riski</li>
                <li className="flex items-center gap-1.5"><Wrench className="h-3 w-3 text-amber-700 dark:text-amber-400" aria-hidden />Kalıp bakımı</li>
                <li className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-red-500" />Şimdi</li>
            </ul>
        </div>
    )
}
