"use client"

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { GeoAddressFilterFields } from "@/features/geo/components/GeoAddressFilterFields"
import {
    VISIT_OUTCOME_LABELS,
    VISIT_STATUS_LABELS,
    VISIT_TYPE_LABELS,
} from "@/features/sales/visits/lib/visitLabels"

type Props = {
    status: string
    type: string
    outcome: string
    scheduledFrom: string
    scheduledTo: string
    countryId: number | null
    stateId: number | null
    cityId: number | null
    hasActiveFilters: boolean
    onStatusChange: (value: string) => void
    onTypeChange: (value: string) => void
    onOutcomeChange: (value: string) => void
    onScheduledFromChange: (value: string) => void
    onScheduledToChange: (value: string) => void
    onGeoChange: (patch: { countryId?: number | null; stateId?: number | null; cityId?: number | null }) => void
    onClear: () => void
}

const STATUS_OPTIONS = Object.entries(VISIT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
const TYPE_OPTIONS = Object.entries(VISIT_TYPE_LABELS).map(([value, label]) => ({ value, label }))
const OUTCOME_OPTIONS = Object.entries(VISIT_OUTCOME_LABELS).map(([value, label]) => ({ value, label }))

/**
 * `/satis/ziyaretlerim` filtre çubuğu — `CustomerMapFilterBar` ile aynı
 * görsel dil (yuvarlak kart, `SearchableSelect`, `GeoAddressFilterFields`).
 * Buradaki fark: filtreler DEĞİŞTİKÇE otomatik uygulanır (harita gibi pahalı
 * bir mount maliyeti yok, bu yüzden ayrı bir "Uygula" adımına gerek yok).
 */
export function SalesVisitsFilterBar({
    status,
    type,
    outcome,
    scheduledFrom,
    scheduledTo,
    countryId,
    stateId,
    cityId,
    hasActiveFilters,
    onStatusChange,
    onTypeChange,
    onOutcomeChange,
    onScheduledFromChange,
    onScheduledToChange,
    onGeoChange,
    onClear,
}: Props) {
    return (
        <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-neutral-950">Filtreler</h2>
                {hasActiveFilters ? (
                    <Button type="button" variant="ghost" size="sm" onClick={onClear}>
                        <X className="h-4 w-4" />
                        Temizle
                    </Button>
                ) : null}
            </div>

            <Separator className="my-4" />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <SearchableSelect
                    aria-label="Durum"
                    value={status || null}
                    onValueChange={(value) => onStatusChange(value ?? "")}
                    options={STATUS_OPTIONS}
                    placeholder="Tüm durumlar"
                    searchPlaceholder="Durum ara"
                />
                <SearchableSelect
                    aria-label="Tür"
                    value={type || null}
                    onValueChange={(value) => onTypeChange(value ?? "")}
                    options={TYPE_OPTIONS}
                    placeholder="Tüm türler"
                    searchPlaceholder="Tür ara"
                />
                <SearchableSelect
                    aria-label="Sonuç"
                    value={outcome || null}
                    onValueChange={(value) => onOutcomeChange(value ?? "")}
                    options={OUTCOME_OPTIONS}
                    placeholder="Tüm sonuçlar"
                    searchPlaceholder="Sonuç ara"
                />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                    <Label htmlFor="visits-scheduled-from" className="text-xs text-neutral-500">
                        Başlangıç tarihi
                    </Label>
                    <Input
                        id="visits-scheduled-from"
                        type="date"
                        value={scheduledFrom}
                        max={scheduledTo || undefined}
                        onChange={(event) => onScheduledFromChange(event.target.value)}
                        className="h-11 rounded-2xl"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="visits-scheduled-to" className="text-xs text-neutral-500">
                        Bitiş tarihi
                    </Label>
                    <Input
                        id="visits-scheduled-to"
                        type="date"
                        value={scheduledTo}
                        min={scheduledFrom || undefined}
                        onChange={(event) => onScheduledToChange(event.target.value)}
                        className="h-11 rounded-2xl"
                    />
                </div>
            </div>

            {/* Adres filtresi kendi satırında (LeadCustomers/CustomerMap deseni). */}
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <GeoAddressFilterFields
                    countryId={countryId}
                    stateId={stateId}
                    cityId={cityId}
                    onChange={onGeoChange}
                />
            </div>
        </section>
    )
}
