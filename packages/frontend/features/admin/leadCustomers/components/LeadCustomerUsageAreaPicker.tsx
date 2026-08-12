"use client"

import Image from "next/image"
import { useDeferredValue, useMemo, useState } from "react"
import { Check, ImageOff, Search, X } from "lucide-react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export type UsageAreaOption = {
    id: string
    name: string
    parentValueId?: string | null
    assets?: Array<{ type?: string; role?: string; url?: string }>
}

export type TaxonomyOption = {
    id: string
    name: string
    parentValueId?: string | null
}

/** Kullanım alanı görseli: PRIMARY → herhangi bir IMAGE. Yoksa null. */
function pickThumb(value: UsageAreaOption) {
    const primary = value.assets?.find((asset) => asset.role === "PRIMARY" && asset.type === "IMAGE")
    if (primary?.url) return primary.url

    return value.assets?.find((asset) => asset.type === "IMAGE")?.url ?? null
}

const ALL_SECTORS = "__all__"

type Props = {
    usageAreaValues: UsageAreaOption[]
    productionGroupValues: TaxonomyOption[]
    sectorValues: TaxonomyOption[]
    selectedIds: string[]
    onToggle: (valueId: string) => void
    onClear: () => void
    /**
     * Formda seçili sektör. Listeyi VARSAYILAN olarak daraltır ama kilitlemez —
     * kullanıcı "Tüm sektörler"e alıp başka sektörlerden de seçebilir.
     */
    focusSectorId?: string | null
    isLoading?: boolean
}

/**
 * Kullanım alanı seçimi FARKLI SEKTÖRLERDEN yapılabilir (2026-08-11 kararı):
 * `sectorValueId` müşterinin birincil sınıfı, kullanım alanları ise ilgi
 * listesidir. Bu yüzden liste sektöre göre DARALTILMAZ — bunun yerine sektör
 * başlıklarıyla GRUPLANIR ve aranabilir, kullanıcı ne seçtiğini görsün.
 */
export function LeadCustomerUsageAreaPicker({
    usageAreaValues,
    productionGroupValues,
    sectorValues,
    selectedIds,
    onToggle,
    onClear,
    focusSectorId,
    isLoading = false,
}: Props) {
    const [search, setSearch] = useState("")
    const [sectorFilterId, setSectorFilterId] = useState(focusSectorId || ALL_SECTORS)
    const [lastFocusSectorId, setLastFocusSectorId] = useState(focusSectorId)
    const deferredSearch = useDeferredValue(search)

    // Formda sektör değiştiğinde liste ona odaklanır. React'in "prop değişince
    // state'i render sırasında ayarla" deseni — effect + setState cascading
    // render üretir ve lint tarafından da yasak.
    // https://react.dev/learn/you-might-not-need-an-effect
    if (focusSectorId !== lastFocusSectorId) {
        setLastFocusSectorId(focusSectorId)
        setSectorFilterId(focusSectorId || ALL_SECTORS)
    }

    /** usageAreaId → { sektör id'si, sektör adı }. Gruplama ve filtre ikisini de kullanır. */
    const sectorByUsageAreaId = useMemo(() => {
        const sectorById = new Map(sectorValues.map((value) => [value.id, value.name]))
        const groupById = new Map(productionGroupValues.map((value) => [value.id, value]))

        return new Map(
            usageAreaValues.map((value) => {
                const group = value.parentValueId ? groupById.get(value.parentValueId) : undefined
                const sectorId = group?.parentValueId ?? null
                const sectorName = sectorId ? sectorById.get(sectorId) : undefined

                return [value.id, { id: sectorId, name: sectorName ?? "Sektörsüz" }]
            }),
        )
    }, [productionGroupValues, sectorValues, usageAreaValues])

    const groups = useMemo(() => {
        const normalized = deferredSearch.trim().toLocaleLowerCase("tr")

        const filtered = usageAreaValues.filter((value) => {
            const sector = sectorByUsageAreaId.get(value.id)

            // Seçili olanlar filtre dışında kalsa bile GÖRÜNÜR kalır: kullanıcı
            // neyi seçtiğini kaybetmemeli.
            const isSelected = selectedIds.includes(value.id)
            const matchesSector =
                sectorFilterId === ALL_SECTORS || sector?.id === sectorFilterId || isSelected

            if (!matchesSector) return false
            if (!normalized) return true

            return (
                value.name.toLocaleLowerCase("tr").includes(normalized) ||
                (sector?.name ?? "").toLocaleLowerCase("tr").includes(normalized)
            )
        })

        const bySector = new Map<string, UsageAreaOption[]>()

        for (const value of filtered) {
            const sectorName = sectorByUsageAreaId.get(value.id)?.name ?? "Sektörsüz"
            const bucket = bySector.get(sectorName)
            if (bucket) bucket.push(value)
            else bySector.set(sectorName, [value])
        }

        return [...bySector.entries()].sort(([left], [right]) => left.localeCompare(right, "tr"))
    }, [deferredSearch, sectorByUsageAreaId, sectorFilterId, selectedIds, usageAreaValues])

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
    const selectedSectorCount = useMemo(
        () =>
            new Set(selectedIds.map((id) => sectorByUsageAreaId.get(id)?.name ?? "Sektörsüz")).size,
        [selectedIds, sectorByUsageAreaId],
    )

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                    <Select value={sectorFilterId} onValueChange={setSectorFilterId}>
                        <SelectTrigger className="h-10 w-full rounded-2xl sm:max-w-[220px]">
                            <SelectValue placeholder="Sektör" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_SECTORS}>Tüm sektörler</SelectItem>
                            {sectorValues.map((value) => (
                                <SelectItem key={value.id} value={value.id}>
                                    {value.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Kullanım alanı ara"
                            className="h-10 rounded-2xl pl-9"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full">
                        {selectedIds.length} seçili
                        {selectedSectorCount > 1 ? ` · ${selectedSectorCount} sektör` : ""}
                    </Badge>
                    {selectedIds.length > 0 ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-2xl"
                            onClick={onClear}
                        >
                            <X className="h-3.5 w-3.5" />
                            Temizle
                        </Button>
                    ) : null}
                </div>
            </div>

            <ScrollArea className="max-h-[340px] rounded-2xl border border-neutral-200 bg-neutral-50/60">
                <div className="space-y-4 p-3">
                    {groups.map(([sectorName, values]) => (
                        <div key={sectorName}>
                            <div className="mb-2 flex items-center gap-2">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                                    {sectorName}
                                </span>
                                <span className="h-px flex-1 bg-neutral-200" />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {values.map((value) => {
                                    const isSelected = selectedSet.has(value.id)
                                    const thumb = pickThumb(value)

                                    return (
                                        <button
                                            key={value.id}
                                            type="button"
                                            onClick={() => onToggle(value.id)}
                                            className={cn(
                                                "group overflow-hidden rounded-2xl border text-start transition",
                                                isSelected
                                                    ? "border-brand bg-brand/8 shadow-sm"
                                                    : "border-neutral-200 bg-white hover:border-neutral-300",
                                            )}
                                        >
                                            <div className="relative aspect-square w-full bg-neutral-50">
                                                {thumb ? (
                                                    <Image
                                                        src={thumb}
                                                        alt={value.name}
                                                        fill
                                                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 20vw"
                                                        className="object-contain p-2"
                                                    />
                                                ) : (
                                                    <div className="grid h-full place-items-center text-neutral-300">
                                                        <ImageOff className="h-6 w-6" />
                                                    </div>
                                                )}

                                                {isSelected ? (
                                                    <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-brand text-white shadow">
                                                        <Check className="h-3.5 w-3.5" />
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div
                                                className={cn(
                                                    "border-t px-2 py-1.5 text-xs font-medium leading-4",
                                                    isSelected
                                                        ? "border-brand/20 text-neutral-950"
                                                        : "border-neutral-100 text-neutral-600",
                                                )}
                                            >
                                                {value.name}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    {groups.length === 0 ? (
                        <p className="px-3 py-8 text-center text-xs text-neutral-500">
                            {isLoading
                                ? "Kullanım alanları yükleniyor"
                                : "Aramanıza uyan kullanım alanı bulunamadı."}
                        </p>
                    ) : null}
                </div>
            </ScrollArea>

            <p className="text-xs text-neutral-500">
                {sectorFilterId === ALL_SECTORS
                    ? "Tüm sektörler listeleniyor; farklı sektörlerden alan seçebilirsiniz."
                    : "Liste seçili sektöre göre daraltıldı. Başka sektörlerden de seçmek için \"Tüm sektörler\"e geçin — mevcut seçimleriniz korunur."}
            </p>
        </div>
    )
}
