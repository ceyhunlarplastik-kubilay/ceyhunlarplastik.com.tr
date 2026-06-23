"use client"

import Image from "next/image"
import { useMemo, useTransition, useEffect, useCallback, useDeferredValue, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import { Box, Loader2, Search, Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useFilterStore } from "@/features/public/products/store/filterStore"
import { ProductFilterPopoverSelect } from "@/features/public/products/components/ProductFilterPopoverSelect"

type Category = {
    id: string
    name: string
    slug: string
    code: string | number
    allowedAttributeValueIds?: string[]
    assets?: {
        role?: string
        type?: string
        url?: string
    }[]
}

type AttributeValue = {
    id: string
    name: string
    slug: string
    parentValueId?: string | null
}

type Attribute = {
    id: string
    code: string
    name: string
    values?: AttributeValue[]
}

type Props = {
    categories: Category[]
    attributes: Attribute[]
    hideCategoryFilter?: boolean
    fixedCategorySlug?: string
    basePath?: string
    showSelectedCategoryPreview?: boolean
    attributeSelectorVariant?: "mixed" | "popover"
    hiddenAttributeCodesWhenCategorySelected?: string[]
    showProductSearch?: boolean
    productSearchPlaceholder?: string
    showProductFiltersOnlyWhenCategorySelected?: boolean
    hideIndustrialFiltersWhenCategorySelected?: boolean
    customerUsageAreaSlugs?: string[]
    customerUsageAreaFilterPending?: boolean
}

const INDUSTRIAL_ATTRIBUTE_CODES = ["sector", "production_group", "usage_area"] as const
const INDUSTRIAL_ATTRIBUTE_CODE_SET = new Set<string>(INDUSTRIAL_ATTRIBUTE_CODES)

function ProductSidebarSearchControl({
    committedSearch,
    placeholder,
    onCommit,
}: {
    committedSearch: string
    placeholder: string
    onCommit: (value: string) => void
}) {
    const [draftSearch, setDraftSearch] = useState(committedSearch)
    const deferredDraftSearch = useDeferredValue(draftSearch)

    useEffect(() => {
        const normalizedSearch = deferredDraftSearch.trim()
        if (normalizedSearch === committedSearch) return

        const timeoutId = window.setTimeout(() => {
            onCommit(normalizedSearch)
        }, 300)

        return () => window.clearTimeout(timeoutId)
    }, [committedSearch, deferredDraftSearch, onCommit])

    return (
        <section className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                Urun Arama
            </div>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                    value={draftSearch}
                    onChange={(event) => setDraftSearch(event.target.value)}
                    placeholder={placeholder}
                    className="h-10 rounded-xl pl-9 pr-10 text-sm"
                />
                {draftSearch ? (
                    <button
                        type="button"
                        onClick={() => setDraftSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-700"
                        aria-label="Aramayi temizle"
                    >
                        <X className="h-4 w-4" />
                    </button>
                ) : null}
            </div>
        </section>
    )
}

export default function ProductFilterSidebar({
    categories,
    attributes,
    hideCategoryFilter = false,
    fixedCategorySlug,
    basePath = "/urunler/filtre",
    showSelectedCategoryPreview = false,
    attributeSelectorVariant = "mixed",
    hiddenAttributeCodesWhenCategorySelected = [],
    showProductSearch = false,
    productSearchPlaceholder = "Ürün kodu veya adı ara",
    showProductFiltersOnlyWhenCategorySelected = false,
    hideIndustrialFiltersWhenCategorySelected = false,
    customerUsageAreaSlugs = [],
    customerUsageAreaFilterPending = false,
}: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const {
        category,
        search,
        attributes: storeAttributes,
        setCategory,
        setSearch,
        setAttributes,
        setFromUrl,
    } = useFilterStore()

    useEffect(() => {
        setFromUrl(new URLSearchParams(searchParams.toString()))
    }, [searchParams, setFromUrl])

    useEffect(() => {
        if (!fixedCategorySlug) return
        if (category === fixedCategorySlug) return
        setCategory(fixedCategorySlug)
    }, [fixedCategorySlug, category, setCategory])

    const scopedCategorySlug = fixedCategorySlug ?? category
    const hiddenAttributeCodesSet = useMemo(
        () => new Set(hiddenAttributeCodesWhenCategorySelected),
        [hiddenAttributeCodesWhenCategorySelected],
    )

    const scopedAllowedValueIds = useMemo(() => {
        if (!scopedCategorySlug) return null
        const targetCategory = categories.find((item) => item.slug === scopedCategorySlug)
        if (!targetCategory) return null
        if (targetCategory.allowedAttributeValueIds === undefined) return null
        return new Set(targetCategory.allowedAttributeValueIds)
    }, [categories, scopedCategorySlug])

    const selectedCategory = useMemo(
        () => categories.find((item) => item.slug === scopedCategorySlug),
        [categories, scopedCategorySlug],
    )

    const productFilterAttributes = useMemo(() => {
        if (showProductFiltersOnlyWhenCategorySelected && !scopedCategorySlug) return []

        const nonIndustrialAttributes = attributes.filter((attribute) => !INDUSTRIAL_ATTRIBUTE_CODE_SET.has(attribute.code))
        const scopedAttributes = !scopedAllowedValueIds
            ? nonIndustrialAttributes
            : nonIndustrialAttributes
                .map((attribute) => {
                    return {
                        ...attribute,
                        values: (attribute.values ?? []).filter((value) => {
                            if (scopedAllowedValueIds.has(value.id)) return true
                            if (value.parentValueId && scopedAllowedValueIds.has(value.parentValueId)) return true
                            return false
                        }),
                    }
                })
                .filter((attribute) => (attribute.values?.length ?? 0) > 0)

        if (!scopedCategorySlug || hiddenAttributeCodesSet.size === 0) {
            return scopedAttributes
        }

        return scopedAttributes.filter((attribute) => !hiddenAttributeCodesSet.has(attribute.code))
    }, [attributes, scopedAllowedValueIds, scopedCategorySlug, hiddenAttributeCodesSet, showProductFiltersOnlyWhenCategorySelected])

    const industrialUsageAttributes = useMemo(() => {
        if (hideIndustrialFiltersWhenCategorySelected && scopedCategorySlug) return []

        return INDUSTRIAL_ATTRIBUTE_CODES
            .map((code) => attributes.find((attribute) => attribute.code === code))
            .filter((attribute): attribute is Attribute => Boolean(attribute && (attribute.values?.length ?? 0) > 0))
    }, [attributes, hideIndustrialFiltersWhenCategorySelected, scopedCategorySlug])

    const filterableAttributes = useMemo(
        () => [...productFilterAttributes, ...industrialUsageAttributes],
        [productFilterAttributes, industrialUsageAttributes],
    )

    const pushStateToUrl = useCallback((
        nextCategory: string | undefined,
        nextAttributes: Record<string, string[]>,
        nextSearch: string = useFilterStore.getState().search,
    ) => {
        const params = new URLSearchParams()
        const effectiveCategory = fixedCategorySlug ?? nextCategory
        if (effectiveCategory) params.set("category", effectiveCategory)
        if (nextSearch.trim()) params.set("search", nextSearch.trim())
        params.set("page", "1")
        params.set("limit", String(useFilterStore.getState().limit))

        Object.entries(nextAttributes).forEach(([key, values]) => {
            if (values.length > 0) params.set(key, values.join(","))
        })

        startTransition(() => {
            router.replace(`${basePath}?${params.toString()}`, { scroll: false })
        })
    }, [basePath, fixedCategorySlug, router, startTransition])

    const filterableAttributeMap = useMemo(
        () => new Map(filterableAttributes.map((attribute) => [attribute.code, attribute])),
        [filterableAttributes]
    )

    useEffect(() => {
        const currentAttributes = useFilterStore.getState().attributes
        const normalized: Record<string, string[]> = {}
        let changed = false

        Object.entries(currentAttributes).forEach(([code, selectedSlugs]) => {
            const attribute = filterableAttributeMap.get(code)
            if (!attribute) {
                if (selectedSlugs.length > 0) changed = true
                return
            }

            const allowedSlugs = new Set((attribute.values ?? []).map((value) => value.slug))
            const filtered = selectedSlugs.filter((slug) => allowedSlugs.has(slug))
            if (filtered.length !== selectedSlugs.length) changed = true

            if (filtered.length > 0) normalized[code] = filtered
        })

        if (!changed) return

        setAttributes(normalized)
        pushStateToUrl(fixedCategorySlug ?? category, normalized)
    }, [filterableAttributeMap, fixedCategorySlug, category, setAttributes, pushStateToUrl])

    function handleCategory(slug: string) {
        if (hideCategoryFilter) return
        const nextCategory = category === slug ? undefined : slug
        setCategory(nextCategory)
        pushStateToUrl(nextCategory, useFilterStore.getState().attributes)
    }

    function handleAttribute(code: string, slug: string) {
        const current = useFilterStore.getState().attributes
        const next: Record<string, string[]> = { ...current }
        const list = next[code] ?? []

        next[code] = list.includes(slug)
            ? list.filter((value) => value !== slug)
            : [...list, slug]

        const localAttributeMap = new Map(filterableAttributes.map((attr) => [attr.code, attr]))
        const sectorValues = localAttributeMap.get("sector")?.values ?? []
        const productionGroupValues = localAttributeMap.get("production_group")?.values ?? []
        const usageAreaValues = localAttributeMap.get("usage_area")?.values ?? []

        const selectedSectorIds = new Set(
            (next["sector"] ?? [])
                .map((selectedSlug) => sectorValues.find((v) => v.slug === selectedSlug)?.id)
                .filter((id): id is string => Boolean(id))
        )

        const allowedProductionGroupSlugs =
            selectedSectorIds.size > 0
                ? new Set(
                    productionGroupValues
                        .filter((value) => value.parentValueId && selectedSectorIds.has(value.parentValueId))
                        .map((value) => value.slug)
                )
                : null

        if (allowedProductionGroupSlugs) {
            next["production_group"] = (next["production_group"] ?? []).filter((value) =>
                allowedProductionGroupSlugs.has(value)
            )
        }

        const selectedProductionGroupIds = new Set(
            (next["production_group"] ?? [])
                .map((selectedSlug) => productionGroupValues.find((v) => v.slug === selectedSlug)?.id)
                .filter((id): id is string => Boolean(id))
        )

        const allowedUsageAreaSlugs =
            selectedProductionGroupIds.size > 0
                ? new Set(
                    usageAreaValues
                        .filter((value) => value.parentValueId && selectedProductionGroupIds.has(value.parentValueId))
                        .map((value) => value.slug)
                )
                : selectedSectorIds.size > 0
                    ? new Set(
                        usageAreaValues
                            .filter((value) => {
                                const parentGroup = productionGroupValues.find((group) => group.id === value.parentValueId)
                                return Boolean(parentGroup?.parentValueId && selectedSectorIds.has(parentGroup.parentValueId))
                            })
                            .map((value) => value.slug)
                    )
                : null

        if (allowedUsageAreaSlugs) {
            next["usage_area"] = (next["usage_area"] ?? []).filter((value) =>
                allowedUsageAreaSlugs.has(value)
            )
        }

        Object.keys(next).forEach((key) => {
            if ((next[key] ?? []).length === 0) delete next[key]
        })

        setAttributes(next)
        pushStateToUrl(category, next)
    }

    function handleApplyCustomerUsageAreaFilter() {
        if (scopedCategorySlug) return

        const usageAreaAttribute = filterableAttributeMap.get("usage_area")
        const availableUsageAreaSlugs = new Set(
            (usageAreaAttribute?.values ?? []).map((value) => value.slug),
        )
        const matchedUsageAreaSlugs = Array.from(
            new Set(customerUsageAreaSlugs.filter((slug) => availableUsageAreaSlugs.has(slug))),
        )

        if (matchedUsageAreaSlugs.length === 0) return

        const current = useFilterStore.getState().attributes
        const next: Record<string, string[]> = {}

        Object.entries(current).forEach(([code, values]) => {
            if (INDUSTRIAL_ATTRIBUTE_CODE_SET.has(code)) return
            if (values.length > 0) next[code] = values
        })

        next["usage_area"] = matchedUsageAreaSlugs

        setAttributes(next)
        pushStateToUrl(category, next)
    }

    function clearAll() {
        if (fixedCategorySlug) {
            setSearch("")
            setAttributes({})
            pushStateToUrl(fixedCategorySlug, {}, "")
            return
        }
        setSearch("")
        startTransition(() => {
            router.replace(basePath, { scroll: false })
        })
    }

    const hasActiveFilters = useMemo(() => {
        const hasCategoryFilter = !fixedCategorySlug && Boolean(category)
        return hasCategoryFilter || Boolean(search.trim()) || Object.keys(storeAttributes).length > 0
    }, [category, fixedCategorySlug, search, storeAttributes])

    const selectedSectorSlugs = useMemo(() => storeAttributes["sector"] ?? [], [storeAttributes])
    const selectedProductionGroupSlugs = useMemo(() => storeAttributes["production_group"] ?? [], [storeAttributes])

    const selectedSectorIds = useMemo(() => {
        const sectorValues = filterableAttributeMap.get("sector")?.values ?? []
        const slugToId = new Map(sectorValues.map((value) => [value.slug, value.id]))
        return selectedSectorSlugs
            .map((slug) => slugToId.get(slug))
            .filter((id): id is string => Boolean(id))
    }, [filterableAttributeMap, selectedSectorSlugs])

    const selectedProductionGroupIds = useMemo(() => {
        const groupValues = filterableAttributeMap.get("production_group")?.values ?? []
        const slugToId = new Map(groupValues.map((value) => [value.slug, value.id]))
        return selectedProductionGroupSlugs
            .map((slug) => slugToId.get(slug))
            .filter((id): id is string => Boolean(id))
    }, [filterableAttributeMap, selectedProductionGroupSlugs])

    const selectedCategoryThumb = useMemo(() => {
        if (!selectedCategory?.assets?.length) return null

        const primary = selectedCategory.assets.find(
            (asset) => asset.role === "PRIMARY" && asset.type === "IMAGE",
        )
        if (primary?.url) return primary.url

        const animation = selectedCategory.assets.find(
            (asset) => asset.role === "ANIMATION" && asset.type === "IMAGE",
        )
        if (animation?.url) return animation.url

        const anyImage = selectedCategory.assets.find((asset) => asset.type === "IMAGE")
        return anyImage?.url ?? null
    }, [selectedCategory])
    const hasCustomerUsageAreaQuickFilter = useMemo(() => {
        if (scopedCategorySlug) return false
        if (customerUsageAreaSlugs.length === 0) return false
        return (filterableAttributeMap.get("usage_area")?.values?.length ?? 0) > 0
    }, [customerUsageAreaSlugs, filterableAttributeMap, scopedCategorySlug])

    function getVisibleAttributeValues(attr: Attribute) {
        const baseValues = attr.values ?? []

        if (attr.code === "production_group" && selectedSectorIds.length > 0) {
            return baseValues.filter((value) => value.parentValueId && selectedSectorIds.includes(value.parentValueId))
        }

        if (attr.code === "usage_area") {
            if (selectedProductionGroupIds.length > 0) {
                return baseValues.filter((value) => value.parentValueId && selectedProductionGroupIds.includes(value.parentValueId))
            }

            if (selectedSectorIds.length > 0) {
                const productionGroupValues = filterableAttributeMap.get("production_group")?.values ?? []
                const productionGroupIdsUnderSelectedSectors = new Set(
                    productionGroupValues
                        .filter((value) => value.parentValueId && selectedSectorIds.includes(value.parentValueId))
                        .map((value) => value.id),
                )

                return baseValues.filter((value) => value.parentValueId && productionGroupIdsUnderSelectedSectors.has(value.parentValueId))
            }
        }

        return baseValues
    }

    function renderAttributeFilter(attr: Attribute) {
        const values = getVisibleAttributeValues(attr)
        if (values.length === 0) return null

        const selected = storeAttributes[attr.code] ?? []
        const usePopoverSelector =
            attributeSelectorVariant === "popover" || values.length > 8

        return (
            <section key={attr.id}>
                {usePopoverSelector ? (
                    <ProductFilterPopoverSelect
                        label={attr.name}
                        options={values.map((value) => ({
                            id: value.id,
                            label: value.name,
                            value: value.slug,
                        }))}
                        selectedValues={selected}
                        onToggle={(slug) => handleAttribute(attr.code, slug)}
                    />
                ) : (
                    <div className="space-y-1.5">
                        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            {attr.name}
                        </h3>
                        {values.map((val) => {
                            const checked = selected.includes(val.slug)
                            return (
                                <Label
                                    key={val.id}
                                    className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-[13px] transition hover:bg-neutral-50"
                                >
                                    <Checkbox
                                        checked={checked}
                                        onCheckedChange={() => handleAttribute(attr.code, val.slug)}
                                    />
                                    {val.name}
                                </Label>
                            )
                        })}
                    </div>
                )}
            </section>
        )
    }

    return (
        <aside className="sticky top-24">
            <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <h2 className="text-base font-semibold">Filtreler</h2>
                    {hasActiveFilters && (
                        <Button size="sm" variant="ghost" onClick={clearAll}>
                            <X className="mr-1 h-4 w-4" />
                            Temizle
                        </Button>
                    )}
                </div>

                {isPending && (
                    <motion.div
                        className="h-1"
                        style={{ background: "var(--color-brand)" }}
                        animate={{ scaleX: [0.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.6 }}
                    />
                )}

                <div className="space-y-4 p-4">
                    {showProductSearch ? (
                        <ProductSidebarSearchControl
                            key={search}
                            committedSearch={search}
                            placeholder={productSearchPlaceholder}
                            onCommit={(nextSearch) => {
                                setSearch(nextSearch)
                                pushStateToUrl(fixedCategorySlug ?? category, useFilterStore.getState().attributes, nextSearch)
                            }}
                        />
                    ) : null}

                    {showSelectedCategoryPreview && selectedCategory ? (
                        <section className="rounded-2xl border-2 border-[var(--color-brand)]/80 bg-[color-mix(in_oklab,var(--color-brand)_8%,white)] p-3 shadow-[0_14px_28px_-22px_rgba(0,0,0,0.35)] ring-2 ring-[var(--color-brand)]/10">
                            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand)]">
                                <Sparkles className="h-3 w-3" />
                                Seçili kategori
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/80">
                                    {selectedCategoryThumb ? (
                                        <Image
                                            src={selectedCategoryThumb}
                                            alt={selectedCategory.name}
                                            fill
                                            sizes="56px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <Box className="h-5 w-5 text-neutral-400" />
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-slate-900">
                                        {selectedCategory.name}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        Kod {selectedCategory.code}
                                    </div>
                                </div>
                            </div>
                        </section>
                    ) : null}

                    {!hideCategoryFilter && (
                        <section>
                            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                Kategoriler
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => {
                                    const active = category === cat.slug
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleCategory(cat.slug)}
                                            className={[
                                                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                                                active
                                                    ? "bg-[var(--color-brand)] text-white shadow-sm"
                                                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                                            ].join(" ")}
                                        >
                                            {cat.code}. {cat.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </section>
                    )}

                    {productFilterAttributes.length > 0 ? (
                        <section className="space-y-3">
                            <div>
                                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                                    Ürün Filtreleri
                                </h3>
                                <p className="mt-1 text-xs leading-5 text-neutral-500">
                                    Kategoriye bağlı model, bağlantı, profil, malzeme ve benzeri filtreler.
                                </p>
                            </div>
                            {productFilterAttributes.map((attr) => renderAttributeFilter(attr))}
                        </section>
                    ) : null}

                    {industrialUsageAttributes.length > 0 ? (
                        <section className="space-y-3 rounded-2xl border border-amber-200/70 bg-amber-50/45 p-3">
                            <div>
                                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                                    Endüstriyel Kullanım
                                </h3>
                                <p className="mt-1 text-xs leading-5 text-amber-900/70">
                                    Sektör, üretim grubu ve kullanım alanı ürünün industrial usage satırlarından filtrelenir.
                                </p>
                            </div>
                            {hasCustomerUsageAreaQuickFilter ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleApplyCustomerUsageAreaFilter}
                                    disabled={isPending || customerUsageAreaFilterPending}
                                    className="w-full justify-center rounded-xl border-emerald-200 bg-white text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50"
                                >
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Benimle İlgili Ürünleri Filtrele
                                </Button>
                            ) : null}
                            {industrialUsageAttributes.map((attr) => renderAttributeFilter(attr))}
                        </section>
                    ) : null}

                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        {isPending ? "Filtreleniyor..." : "Hazır"}
                    </div>
                </div>
            </div>
        </aside>
    )
}
