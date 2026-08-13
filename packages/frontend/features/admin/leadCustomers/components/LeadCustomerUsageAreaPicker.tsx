"use client"

import Image from "next/image"
import { useDeferredValue, useMemo, useState } from "react"
import { Check, ImageOff, Layers, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
const UNGROUPED_LABEL = "Sektörsüz"

type Props = {
    usageAreaValues: UsageAreaOption[]
    productionGroupValues: TaxonomyOption[]
    sectorValues: TaxonomyOption[]
    selectedIds: string[]
    onToggle: (valueId: string) => void
    onClear: () => void
    /**
     * Formdaki birincil sektör. Listeyi VARSAYILAN olarak daraltır ama
     * kilitlemez — kullanıcı "Tümü"ye alıp başka sektörlerden de seçebilir.
     */
    focusSectorId?: string | null
    isLoading?: boolean
}

/**
 * Kullanım alanı seçimi FARKLI SEKTÖRLERDEN yapılabilir: `sectorValueId`
 * müşterinin birincil sınıfı, kullanım alanları ise ilgi listesidir.
 *
 * Bu yüzden liste sektöre göre kilitlenmez; sektör CHIP'leri bir filtredir.
 * Chip tercih edilmesinin sebebi: formun "Sektör" alanının yanında ikinci bir
 * dropdown, "veri girişi mi filtre mi?" ayrımını kaybettiriyordu.
 *
 * İç scroll YOK: dialog'un kendi scroll'u kullanılır. İç içe scroll alanı
 * kullanıcıyı 340px'lik bir pencereye hapsediyordu.
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
    // render üretir. https://react.dev/learn/you-might-not-need-an-effect
    if (focusSectorId !== lastFocusSectorId) {
        setLastFocusSectorId(focusSectorId)
        setSectorFilterId(focusSectorId || ALL_SECTORS)
    }

    /** usageAreaId → { sektör id, sektör adı }. Gruplama, filtre ve chip sayıları. */
    const sectorByUsageAreaId = useMemo(() => {
        const sectorById = new Map(sectorValues.map((value) => [value.id, value.name]))
        const groupById = new Map(productionGroupValues.map((value) => [value.id, value]))

        return new Map(
            usageAreaValues.map((value) => {
                const group = value.parentValueId ? groupById.get(value.parentValueId) : undefined
                const sectorId = group?.parentValueId ?? null
                const sectorName = sectorId ? sectorById.get(sectorId) : undefined

                return [value.id, { id: sectorId, name: sectorName ?? UNGROUPED_LABEL }]
            }),
        )
    }, [productionGroupValues, sectorValues, usageAreaValues])

    /** Filtre chip'leri: yalnız gerçekten kullanım alanı olan sektörler. */
    const sectorChips = useMemo(() => {
        const counts = new Map<string, number>()

        for (const value of usageAreaValues) {
            const sectorId = sectorByUsageAreaId.get(value.id)?.id
            if (!sectorId) continue
            counts.set(sectorId, (counts.get(sectorId) ?? 0) + 1)
        }

        return sectorValues
            .filter((sector) => counts.has(sector.id))
            .map((sector) => ({
                id: sector.id,
                name: sector.name,
                count: counts.get(sector.id) ?? 0,
            }))
    }, [sectorByUsageAreaId, sectorValues, usageAreaValues])

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

    const groups = useMemo(() => {
        const normalized = deferredSearch.trim().toLocaleLowerCase("tr")

        const filtered = usageAreaValues.filter((value) => {
            const sector = sectorByUsageAreaId.get(value.id)

            // Seçili olanlar filtre dışında kalsa bile GÖRÜNÜR kalır: kullanıcı
            // neyi seçtiğini kaybetmemeli.
            const matchesSector =
                sectorFilterId === ALL_SECTORS ||
                sector?.id === sectorFilterId ||
                selectedSet.has(value.id)

            if (!matchesSector) return false
            if (!normalized) return true

            return (
                value.name.toLocaleLowerCase("tr").includes(normalized) ||
                (sector?.name ?? "").toLocaleLowerCase("tr").includes(normalized)
            )
        })

        const bySector = new Map<string, UsageAreaOption[]>()

        for (const value of filtered) {
            const sectorName = sectorByUsageAreaId.get(value.id)?.name ?? UNGROUPED_LABEL
            const bucket = bySector.get(sectorName)
            if (bucket) bucket.push(value)
            else bySector.set(sectorName, [value])
        }

        return [...bySector.entries()].sort(([left], [right]) => left.localeCompare(right, "tr"))
    }, [deferredSearch, sectorByUsageAreaId, sectorFilterId, selectedSet, usageAreaValues])

    /** Seçilenler çubuğu — scroll'dan bağımsız, her zaman görünür ve kaldırılabilir. */
    const selectedValues = useMemo(
        () => usageAreaValues.filter((value) => selectedSet.has(value.id)),
        [selectedSet, usageAreaValues],
    )
    const selectedSectorCount = useMemo(
        () => new Set(selectedValues.map((value) => sectorByUsageAreaId.get(value.id)?.name)).size,
        [sectorByUsageAreaId, selectedValues],
    )

    return (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {/* Araç çubuğu: dialog scroll'unda yukarıda sabit kalır. */}
            <div className="sticky top-0 z-10 space-y-3 border-b border-neutral-100 bg-white/95 p-3 backdrop-blur">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Kullanım alanı ara"
                            className="h-10 rounded-xl border-neutral-200 pl-9"
                        />
                        {search ? (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                aria-label="Aramayı temizle"
                                className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <Layers className="h-3.5 w-3.5" />
                        <span className="font-medium text-neutral-800">{selectedIds.length}</span>
                        seçili
                        {selectedSectorCount > 1 ? (
                            <span className="text-neutral-400">· {selectedSectorCount} sektör</span>
                        ) : null}
                    </div>
                </div>

                {sectorChips.length > 0 ? (
                    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
                        <SectorChip
                            label="Tümü"
                            count={usageAreaValues.length}
                            isActive={sectorFilterId === ALL_SECTORS}
                            onClick={() => setSectorFilterId(ALL_SECTORS)}
                        />
                        {sectorChips.map((sector) => (
                            <SectorChip
                                key={sector.id}
                                label={sector.name}
                                count={sector.count}
                                isActive={sectorFilterId === sector.id}
                                onClick={() => setSectorFilterId(sector.id)}
                            />
                        ))}
                    </div>
                ) : null}
            </div>

            {selectedValues.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 border-b border-neutral-100 bg-brand/4 px-3 py-2.5">
                    {selectedValues.map((value) => (
                        <button
                            key={value.id}
                            type="button"
                            onClick={() => onToggle(value.id)}
                            className="group inline-flex items-center gap-1 rounded-full border border-brand/30 bg-white py-1 pl-2.5 pr-1.5 text-xs font-medium text-neutral-800 transition hover:border-brand/60"
                        >
                            {value.name}
                            <span className="grid h-4 w-4 place-items-center rounded-full text-neutral-400 transition group-hover:bg-neutral-100 group-hover:text-neutral-700">
                                <X className="h-3 w-3" />
                            </span>
                        </button>
                    ))}

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ms-auto h-7 rounded-full px-2 text-xs text-neutral-500 hover:text-neutral-800"
                        onClick={onClear}
                    >
                        Tümünü kaldır
                    </Button>
                </div>
            ) : null}

            <div className="space-y-5 p-3">
                {groups.map(([sectorName, values]) => (
                    <div key={sectorName}>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                                {sectorName}
                            </span>
                            <span className="text-[11px] text-neutral-300">{values.length}</span>
                            <span className="h-px flex-1 bg-neutral-100" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                            {values.map((value) => {
                                const isSelected = selectedSet.has(value.id)
                                const thumb = pickThumb(value)

                                return (
                                    <button
                                        key={value.id}
                                        type="button"
                                        onClick={() => onToggle(value.id)}
                                        aria-pressed={isSelected}
                                        className={cn(
                                            "group relative overflow-hidden rounded-xl border text-start transition",
                                            isSelected
                                                ? "border-brand ring-2 ring-brand/20"
                                                : "border-neutral-200 hover:border-neutral-300 hover:shadow-sm",
                                        )}
                                    >
                                        <div className="relative aspect-square w-full bg-neutral-50">
                                            {thumb ? (
                                                <Image
                                                    src={thumb}
                                                    alt={value.name}
                                                    fill
                                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                                    className="object-contain p-2 transition duration-200 group-hover:scale-[1.04]"
                                                />
                                            ) : (
                                                <div className="grid h-full place-items-center text-neutral-300">
                                                    <ImageOff className="h-5 w-5" />
                                                </div>
                                            )}

                                            <span
                                                className={cn(
                                                    "absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full border transition",
                                                    isSelected
                                                        ? "border-brand bg-brand text-white"
                                                        : "border-neutral-200 bg-white/80 text-transparent group-hover:text-neutral-300",
                                                )}
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                            </span>
                                        </div>

                                        <div
                                            className={cn(
                                                "border-t px-2 py-1.5 text-[11px] font-medium leading-4",
                                                isSelected
                                                    ? "border-brand/20 bg-brand/5 text-neutral-950"
                                                    : "border-neutral-100 text-neutral-600",
                                            )}
                                        >
                                            <span className="line-clamp-2">{value.name}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}

                {groups.length === 0 ? (
                    <div className="px-3 py-10 text-center">
                        <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
                            <Search className="h-5 w-5" />
                        </div>
                        <p className="mt-3 text-sm font-medium text-neutral-700">
                            {isLoading ? "Kullanım alanları yükleniyor" : "Sonuç bulunamadı"}
                        </p>
                        {!isLoading ? (
                            <p className="mt-1 text-xs text-neutral-500">
                                Aramayı değiştirin veya &quot;Tümü&quot; sekmesine geçin.
                            </p>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

function SectorChip({
    label,
    count,
    isActive,
    onClick,
}: {
    label: string
    count: number
    isActive: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={isActive}
            className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                isActive
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
            )}
        >
            {label}
            <span className={cn("text-[10px]", isActive ? "text-white/60" : "text-neutral-400")}>
                {count}
            </span>
        </button>
    )
}
