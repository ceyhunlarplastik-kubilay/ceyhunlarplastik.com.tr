"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isValidDateKey } from "@core/helpers/production/productionCalendar"
import { statsQuickRanges } from "@/features/production/stats/lib/productHistoryFormat"

type Range = { from: string; to: string }

/** İstatistik penceresinin iki günü (fabrika günü, iki uç dahil). Izgara hücresine iki öğe olarak düşer. */
export function StatsDateInputs({ from, to, onRangeChange }: Range & { onRangeChange: (range: Range) => void }) {
    return (
        <>
            <Input
                type="date"
                value={from}
                max={to}
                onChange={(event) => { if (isValidDateKey(event.target.value)) onRangeChange({ from: event.target.value, to }) }}
                aria-label="Başlangıç günü"
            />
            <Input
                type="date"
                value={to}
                min={from}
                onChange={(event) => { if (isValidDateKey(event.target.value)) onRangeChange({ from, to: event.target.value }) }}
                aria-label="Bitiş günü"
            />
        </>
    )
}

/** Hızlı pencere düğmeleri; seçili olan vurgulanır. */
export function StatsQuickRangeButtons({
    from,
    to,
    today,
    ranges,
    onRangeChange,
}: Range & { today: string; ranges?: ReadonlyArray<{ label: string; days: number }>; onRangeChange: (range: Range) => void }) {
    return (
        <div className="flex flex-wrap gap-2">
            {statsQuickRanges(today, ranges).map((range) => {
                const active = range.from === from && range.to === to
                return (
                    <Button
                        key={range.label}
                        type="button"
                        size="sm"
                        variant={active ? "secondary" : "outline"}
                        className="rounded-full"
                        aria-pressed={active}
                        onClick={() => onRangeChange({ from: range.from, to: range.to })}
                    >
                        {range.label}
                    </Button>
                )
            })}
        </div>
    )
}
