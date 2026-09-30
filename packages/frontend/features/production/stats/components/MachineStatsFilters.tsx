"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MachineStats } from "@/features/production/stats/api/types"
import { MACHINE_STATS_QUICK_RANGES } from "@/features/production/stats/lib/productHistoryFormat"
import { StatsDateInputs, StatsQuickRangeButtons } from "./StatsRangeControls"

const ALL = "__all__"

type Props = {
    areas: MachineStats["areas"]
    areaId: string
    from: string
    to: string
    today: string
    onAreaChange: (areaId: string | null) => void
    onRangeChange: (range: { from: string; to: string }) => void
}

/** Üretim alanı + tarih aralığı (hızlı aralıklarla). Değerler URL'de. */
export function MachineStatsFilters({ areas, areaId, from, to, today, onAreaChange, onRangeChange }: Props) {
    return (
        <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,18rem)_9.5rem_9.5rem]">
                <Select value={areaId || ALL} onValueChange={(value) => onAreaChange(value === ALL ? null : value)}>
                    <SelectTrigger className="w-full sm:col-span-2 lg:col-span-1" aria-label="Üretim alanı">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>Tüm alanlar</SelectItem>
                        {areas.map((area) => (
                            <SelectItem key={area.id} value={area.id}>{area.code} · {area.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <StatsDateInputs from={from} to={to} onRangeChange={onRangeChange} />
            </div>
            <StatsQuickRangeButtons from={from} to={to} today={today} ranges={MACHINE_STATS_QUICK_RANGES} onRangeChange={onRangeChange} />
        </div>
    )
}
