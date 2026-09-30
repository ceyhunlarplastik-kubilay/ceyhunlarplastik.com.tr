"use client"

import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatsDateInputs, StatsQuickRangeButtons } from "./StatsRangeControls"

type Props = {
    search: string
    onlySuggestions: boolean
    onlyMaintenance: boolean
    from: string
    to: string
    today: string
    onSearchChange: (search: string) => void
    onToggleSuggestions: () => void
    onToggleMaintenance: () => void
    onRangeChange: (range: { from: string; to: string }) => void
}

/** Arama + tarih aralığı (hızlı aralıklarla) + "önerisi olanlar" / "bakım uyarısı olanlar". Değerler URL'de. */
export function MoldStatsFilters({
    search,
    onlySuggestions,
    onlyMaintenance,
    from,
    to,
    today,
    onSearchChange,
    onToggleSuggestions,
    onToggleMaintenance,
    onRangeChange,
}: Props) {
    return (
        <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,20rem)_9.5rem_9.5rem]">
                <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Kalıp kodu, adı ya da makine"
                        className="ps-9"
                        aria-label="Kalıp ara"
                    />
                </div>
                <StatsDateInputs from={from} to={to} onRangeChange={onRangeChange} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <StatsQuickRangeButtons from={from} to={to} today={today} onRangeChange={onRangeChange} />
                <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
                <Button type="button" size="sm" variant={onlySuggestions ? "secondary" : "outline"} className="rounded-full" aria-pressed={onlySuggestions} onClick={onToggleSuggestions}>
                    Çevrim önerisi olanlar
                </Button>
                <Button type="button" size="sm" variant={onlyMaintenance ? "secondary" : "outline"} className="rounded-full" aria-pressed={onlyMaintenance} onClick={onToggleMaintenance}>
                    Bakım uyarısı olanlar
                </Button>
            </div>
        </div>
    )
}
