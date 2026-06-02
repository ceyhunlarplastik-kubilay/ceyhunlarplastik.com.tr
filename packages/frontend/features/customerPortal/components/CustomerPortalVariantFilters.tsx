"use client"

import { useEffect, useMemo, useRef, type KeyboardEvent, type ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Filter, Layers3, Palette, RotateCcw, SlidersHorizontal } from "lucide-react"
import { useForm } from "react-hook-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
    buildVariantFilterDefaultValues,
    customerPortalVariantFilterSchema,
    formatVariantFilterPrice,
    normalizeVariantPriceRange,
    type AppliedVariantFilters,
    type CustomerPortalVariantFilterFormValues,
    type CustomerPortalVariantFilterValues,
    type VariantPriceBounds,
} from "@/features/customerPortal/schema/customerPortalVariantFilters"

type FilterOption = {
    id: string
    label: string
    count: number
    hex?: string | null
}

interface Props {
    colorOptions: FilterOption[]
    materialOptions: FilterOption[]
    priceBounds: VariantPriceBounds | null
    hasMixedPriceCurrencies: boolean
    activeFilterCount: number
    visibleCount: number
    totalCount: number
    onApply: (filters: AppliedVariantFilters) => void
}

export function CustomerPortalVariantFilters({
    colorOptions,
    materialOptions,
    priceBounds,
    hasMixedPriceCurrencies,
    activeFilterCount,
    visibleCount,
    totalCount,
    onApply,
}: Props) {
    const lastResetKeyRef = useRef<string | null>(null)
    const defaultValues = useMemo(
        () => buildVariantFilterDefaultValues(priceBounds),
        [priceBounds],
    )
    const priceBoundsKey = `${priceBounds?.currency ?? "none"}:${priceBounds?.min ?? "none"}:${priceBounds?.max ?? "none"}`

    const form = useForm<
        CustomerPortalVariantFilterFormValues,
        undefined,
        CustomerPortalVariantFilterValues
    >({
        resolver: zodResolver(customerPortalVariantFilterSchema),
        defaultValues,
    })

    const watchedMinPrice = form.watch("minPrice") ?? ""
    const watchedMaxPrice = form.watch("maxPrice") ?? ""
    const watchedColorIds = form.watch("colorIds") ?? []
    const watchedMaterialIds = form.watch("materialIds") ?? []

    const normalizedRange = useMemo(
        () => normalizeVariantPriceRange({ minPrice: watchedMinPrice, maxPrice: watchedMaxPrice }, priceBounds),
        [priceBounds, watchedMaxPrice, watchedMinPrice],
    )

    useEffect(() => {
        if (lastResetKeyRef.current === priceBoundsKey) return
        lastResetKeyRef.current = priceBoundsKey
        form.reset(defaultValues)
    }, [priceBoundsKey])

    function toggleMultiValue(field: "colorIds" | "materialIds", value: string) {
        const current = form.getValues(field) ?? []
        form.setValue(
            field,
            current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value],
            { shouldDirty: true },
        )
    }

    function handleSliderChange(kind: "min" | "max", nextValue: number) {
        if (!priceBounds) return

        const currentRange = normalizeVariantPriceRange(
            {
                minPrice: form.getValues("minPrice") ?? "",
                maxPrice: form.getValues("maxPrice") ?? "",
            },
            priceBounds,
        )

        if (kind === "min") {
            const safeValue = Math.min(nextValue, currentRange.maxPrice ?? priceBounds.max)
            form.setValue("minPrice", formatVariantFilterPrice(safeValue), { shouldDirty: true, shouldValidate: true })
            return
        }

        const safeValue = Math.max(nextValue, currentRange.minPrice ?? priceBounds.min)
        form.setValue("maxPrice", formatVariantFilterPrice(safeValue), { shouldDirty: true, shouldValidate: true })
    }

    function applyFilters(values: CustomerPortalVariantFilterValues) {
        const range = normalizeVariantPriceRange(values, priceBounds)
        onApply({
            colorIds: values.colorIds ?? [],
            materialIds: values.materialIds ?? [],
            minPrice: hasMixedPriceCurrencies ? null : range.minPrice,
            maxPrice: hasMixedPriceCurrencies ? null : range.maxPrice,
        })

        if (priceBounds) {
            form.setValue("minPrice", formatVariantFilterPrice(range.minPrice ?? priceBounds.min), {
                shouldDirty: false,
            })
            form.setValue("maxPrice", formatVariantFilterPrice(range.maxPrice ?? priceBounds.max), {
                shouldDirty: false,
            })
        }
    }

    function clearFilters() {
        const cleared = buildVariantFilterDefaultValues(priceBounds)
        form.reset(cleared)
        onApply({
            colorIds: [],
            materialIds: [],
            minPrice: hasMixedPriceCurrencies || !priceBounds ? null : priceBounds.min,
            maxPrice: hasMixedPriceCurrencies || !priceBounds ? null : priceBounds.max,
        })
    }

    function createSelectableCardHandlers(field: "colorIds" | "materialIds", value: string) {
        return {
            onClick: () => toggleMultiValue(field, value),
            onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
                if (event.key !== "Enter" && event.key !== " ") return
                event.preventDefault()
                toggleMultiValue(field, value)
            },
        }
    }

    const sliderMin = priceBounds ? priceBounds.min : 0
    const sliderMax = priceBounds ? priceBounds.max : 0
    const sliderStep = priceBounds && !Number.isInteger(priceBounds.min + priceBounds.max) ? 0.01 : 0.01
    const sliderStart = priceBounds && priceBounds.max > priceBounds.min
        ? ((normalizedRange.minPrice ?? priceBounds.min) - priceBounds.min) / (priceBounds.max - priceBounds.min) * 100
        : 0
    const sliderEnd = priceBounds && priceBounds.max > priceBounds.min
        ? ((normalizedRange.maxPrice ?? priceBounds.max) - priceBounds.min) / (priceBounds.max - priceBounds.min) * 100
        : 100

    return (
        <div className="rounded-[24px] border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                            <Filter className="h-4 w-4" />
                            Varyant Filtreleri
                        </div>
                        <p className="text-sm leading-6 text-neutral-500">
                            Renk, hammadde ve fiyat aralığına göre bu ölçüye uygun varyantları daraltın.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{visibleCount} / {totalCount} varyant</Badge>
                        {activeFilterCount > 0 ? <Badge variant="outline">{activeFilterCount} aktif filtre</Badge> : null}
                    </div>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(applyFilters)} className="space-y-5 p-4 sm:p-5">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,1.1fr)]">
                        <FilterSelectionCard
                            title="Renk"
                            icon={<Palette className="h-4 w-4" />}
                            emptyLabel="Bu ölçü grubu için renk seçeneği bulunmuyor."
                        >
                            {colorOptions.map((option) => {
                                const checked = watchedColorIds.includes(option.id)
                                const cardHandlers = createSelectableCardHandlers("colorIds", option.id)

                                return (
                                    <div
                                        key={option.id}
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={checked}
                                        {...cardHandlers}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition",
                                            checked
                                                ? "border-neutral-900 bg-neutral-950 text-white shadow-sm"
                                                : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50",
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    "flex h-4 w-4 items-center justify-center rounded-[4px] border transition",
                                                    checked
                                                        ? "border-white/50 bg-white text-neutral-900"
                                                        : "border-neutral-300 bg-transparent",
                                                )}
                                            >
                                                {checked ? <Check className="h-3 w-3" /> : null}
                                            </span>
                                            <span
                                                className={cn(
                                                    "h-4 w-4 rounded-full border",
                                                    checked ? "border-white/50" : "border-neutral-300",
                                                )}
                                                style={{ backgroundColor: option.hex || "#d4d4d8" }}
                                            />
                                            <span className="text-sm font-medium">{option.label}</span>
                                        </div>
                                        <span className={cn("text-xs", checked ? "text-white/70" : "text-neutral-400")}>
                                            {option.count}
                                        </span>
                                    </div>
                                )
                            })}
                        </FilterSelectionCard>

                        <FilterSelectionCard
                            title="Ham Madde"
                            icon={<Layers3 className="h-4 w-4" />}
                            emptyLabel="Bu ölçü grubu için ham madde seçeneği bulunmuyor."
                        >
                            {materialOptions.map((option) => {
                                const checked = watchedMaterialIds.includes(option.id)
                                const cardHandlers = createSelectableCardHandlers("materialIds", option.id)

                                return (
                                    <div
                                        key={option.id}
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={checked}
                                        {...cardHandlers}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition",
                                            checked
                                                ? "border-brand bg-brand/95 text-white shadow-sm"
                                                : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50",
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    "flex h-4 w-4 items-center justify-center rounded-[4px] border transition",
                                                    checked
                                                        ? "border-white/50 bg-white text-brand"
                                                        : "border-neutral-300 bg-transparent",
                                                )}
                                            >
                                                {checked ? <Check className="h-3 w-3" /> : null}
                                            </span>
                                            <span className="text-sm font-medium">{option.label}</span>
                                        </div>
                                        <span className={cn("text-xs", checked ? "text-white/70" : "text-neutral-400")}>
                                            {option.count}
                                        </span>
                                    </div>
                                )
                            })}
                        </FilterSelectionCard>

                        <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                                        <SlidersHorizontal className="h-4 w-4" />
                                        Fiyat
                                    </div>
                                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                                        Min ve max liste satış fiyatına göre filtreleyin.
                                    </p>
                                </div>
                                {priceBounds ? (
                                    <Badge variant="outline">{priceBounds.currency}</Badge>
                                ) : null}
                            </div>

                            {hasMixedPriceCurrencies ? (
                                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                                    Bu ölçü grubunda farklı para birimlerinde fiyat bulunan varyantlar olduğu için fiyat filtresi kapatıldı.
                                </div>
                            ) : !priceBounds ? (
                                <div className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500">
                                    Fiyat bilgisi bulunan varyant olmadığı için fiyat filtresi şu an kullanılamıyor.
                                </div>
                            ) : (
                                <div className="mt-4 space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="minPrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                                                        En az ({priceBounds.currency})
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            inputMode="numeric"
                                                            autoComplete="off"
                                                            placeholder={formatVariantFilterPrice(priceBounds.min)}
                                                            className="h-12 rounded-2xl border-neutral-300 bg-white"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="maxPrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                                                        En fazla ({priceBounds.currency})
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            inputMode="numeric"
                                                            autoComplete="off"
                                                            placeholder={formatVariantFilterPrice(priceBounds.max)}
                                                            className="h-12 rounded-2xl border-neutral-300 bg-white"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="rounded-[22px] border border-neutral-200 bg-white p-4">
                                        <div className="relative h-10">
                                            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-neutral-200" />
                                            <div
                                                className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-neutral-950"
                                                style={{
                                                    left: `${sliderStart}%`,
                                                    width: `${Math.max(sliderEnd - sliderStart, 0)}%`,
                                                }}
                                            />
                                            <RangeInput
                                                min={sliderMin}
                                                max={sliderMax}
                                                step={sliderStep}
                                                value={normalizedRange.minPrice ?? priceBounds.min}
                                                onChange={(value) => handleSliderChange("min", value)}
                                            />
                                            <RangeInput
                                                min={sliderMin}
                                                max={sliderMax}
                                                step={sliderStep}
                                                value={normalizedRange.maxPrice ?? priceBounds.max}
                                                onChange={(value) => handleSliderChange("max", value)}
                                            />
                                        </div>

                                        <div className="mt-3 flex items-center justify-between text-xs font-medium text-neutral-500">
                                            <span>{formatVariantFilterPrice(priceBounds.min)} {priceBounds.currency}</span>
                                            <span>{formatVariantFilterPrice(priceBounds.max)} {priceBounds.currency}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-neutral-500">
                            {activeFilterCount > 0
                                ? "Filtreleri uyguladığınızda varyant listesi yeni koşullara göre yenilenir."
                                : "Tüm varyantlar gösteriliyor. Gerekirse filtre uygulayarak listeyi daraltabilirsiniz."}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button type="button" variant="ghost" onClick={clearFilters}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Sıfırla
                            </Button>
                            <Button type="submit" className="rounded-full px-5">
                                Filtreleri Uygula
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    )
}

function FilterSelectionCard({
    title,
    icon,
    emptyLabel,
    children,
}: {
    title: string
    icon: ReactNode
    emptyLabel: string
    children: ReactNode
}) {
    const count = Array.isArray(children) ? children.length : 0

    return (
        <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                        {icon}
                        {title}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                        {count > 0 ? "Bir veya birden fazla seçenek işaretleyebilirsiniz." : emptyLabel}
                    </p>
                </div>
                {count > 0 ? <Badge variant="outline">{count} seçenek</Badge> : null}
            </div>

            {count > 0 ? (
                <div className="mt-4 grid gap-2">{children}</div>
            ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-5 text-sm text-neutral-400">
                    {emptyLabel}
                </div>
            )}
        </div>
    )
}

function RangeInput({
    min,
    max,
    step,
    value,
    onChange,
}: {
    min: number
    max: number
    step: number
    value: number
    onChange: (value: number) => void
}) {
    return (
        <Label className="absolute inset-x-0 top-1/2 -translate-y-1/2">
            <span className="sr-only">Fiyat aralığı</span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className={cn(
                    "pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 appearance-none bg-transparent",
                    "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent",
                    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:-mt-[9px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-neutral-950 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm",
                    "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:bg-transparent",
                    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-neutral-950 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-sm",
                )}
            />
        </Label>
    )
}
