"use client"

import Image from "next/image"
import { useDeferredValue, useMemo, useState } from "react"
import { Boxes, Check, Search, Shapes, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import type { Category } from "@/features/public/categories/types"

type Props = {
    categories: Category[]
    categoryId: string
    onCategoryIdChange: (value: string) => void
    railMode?: "featured" | "all"
}

function pickCategoryThumb(category: Category) {
    const primary = category.assets?.find(
        (asset) => asset.role === "PRIMARY" && asset.type === "IMAGE"
    )
    if (primary?.url) return primary.url

    const animation = category.assets?.find(
        (asset) => asset.role === "ANIMATION" && asset.type === "IMAGE"
    )
    if (animation?.url) return animation.url

    const anyImage = category.assets?.find((asset) => asset.type === "IMAGE")
    return anyImage?.url ?? null
}

function ProductCategoryCard({
    category,
    selected,
    onClick,
}: {
    category: Category
    selected: boolean
    onClick: () => void
}) {
    const thumb = pickCategoryThumb(category)

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "group relative flex min-w-[220px] items-center gap-3 rounded-2xl border bg-white p-3 text-left transition",
                "hover:border-[var(--color-brand)]/40 hover:shadow-sm",
                selected
                    ? "border-2 border-[var(--color-brand)] bg-[color-mix(in_oklab,var(--color-brand)_10%,white)] shadow-[0_14px_28px_-20px_rgba(0,0,0,0.35)] ring-2 ring-[var(--color-brand)]/15"
                    : "border-slate-200",
            ].join(" ")}
        >
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                {thumb ? (
                    <Image
                        src={thumb}
                        alt={category.name}
                        fill
                        sizes="64px"
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                ) : (
                    <Shapes className="h-5 w-5 text-slate-400" />
                )}
            </div>

            <div className="min-w-0 flex-1">
                {selected ? (
                    <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand)]">
                        <Sparkles className="h-3 w-3" />
                        Seçili
                    </div>
                ) : null}
                <p className="truncate text-sm font-semibold text-slate-900">
                    {category.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    Kod {category.code}
                </p>
            </div>

            {selected && (
                <div className="shrink-0 rounded-full bg-[var(--color-brand)] p-1 text-white">
                    <Check className="h-3.5 w-3.5" />
                </div>
            )}
        </button>
    )
}

function AllProductsCard({
    selected,
    onClick,
}: {
    selected: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "group flex min-w-[220px] items-center gap-3 rounded-2xl border bg-white p-3 text-left transition",
                "hover:border-[var(--color-brand)]/40 hover:shadow-sm",
                selected
                    ? "border-2 border-[var(--color-brand)] bg-[color-mix(in_oklab,var(--color-brand)_10%,white)] shadow-[0_14px_28px_-20px_rgba(0,0,0,0.35)] ring-2 ring-[var(--color-brand)]/15"
                    : "border-slate-200",
            ].join(" ")}
        >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Boxes className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
                {selected ? (
                    <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand)]">
                        <Sparkles className="h-3 w-3" />
                        Seçili
                    </div>
                ) : null}
                <p className="truncate text-sm font-semibold text-slate-900">
                    Tüm Ürünler
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    Kategori filtresi kapalı
                </p>
            </div>

            {selected && (
                <div className="shrink-0 rounded-full bg-[var(--color-brand)] p-1 text-white">
                    <Check className="h-3.5 w-3.5" />
                </div>
            )}
        </button>
    )
}

export function ProductCategoryFilterRail({
    categories,
    categoryId,
    onCategoryIdChange,
    railMode = "featured",
}: Props) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogSearch, setDialogSearch] = useState("")
    const deferredDialogSearch = useDeferredValue(dialogSearch)

    const sortedCategories = useMemo(
        () => [...categories].sort((a, b) => a.code - b.code),
        [categories]
    )

    const featuredCategories = useMemo(() => {
        const featured = sortedCategories.slice(0, 7)

        if (!categoryId) return featured

        const selectedCategory = sortedCategories.find((category) => category.id === categoryId)
        if (!selectedCategory) return featured
        if (featured.some((category) => category.id === selectedCategory.id)) return featured

        return [selectedCategory, ...featured.slice(0, 6)]
    }, [categoryId, sortedCategories])

    const visibleRailCategories = useMemo(() => {
        if (railMode !== "all") return featuredCategories
        if (!categoryId) return sortedCategories

        const selected = sortedCategories.find((category) => category.id === categoryId)
        if (!selected) return sortedCategories

        return [selected, ...sortedCategories.filter((category) => category.id !== selected.id)]
    }, [categoryId, featuredCategories, railMode, sortedCategories])
    const filteredDialogCategories = useMemo(() => {
        const normalizedSearch = deferredDialogSearch.trim().toLocaleLowerCase("tr-TR")
        if (!normalizedSearch) return sortedCategories

        return sortedCategories.filter((category) =>
            `${category.code} ${category.name} ${category.slug}`
                .toLocaleLowerCase("tr-TR")
                .includes(normalizedSearch)
        )
    }, [deferredDialogSearch, sortedCategories])

    const selectedCategory = useMemo(
        () => sortedCategories.find((category) => category.id === categoryId),
        [categoryId, sortedCategories],
    )

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-slate-900">
                        Kategoriye Göre Filtrele
                    </p>
                    <p className="text-xs text-slate-500">
                        Görsel kartlardan hızlı seçim yapabilir veya tüm kategorileri açabilirsiniz.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                            {selectedCategory ? `${selectedCategory.name} seçili` : "Tüm Ürünler seçili"}
                        </div>
                    </div>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Shapes className="h-4 w-4" />
                            Tüm Kategoriler
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl">
                        <DialogHeader>
                            <DialogTitle>Kategori Seç</DialogTitle>
                            <DialogDescription>
                                Ürünleri kategoriye göre filtreleyin. Arama ile kategori kodu, adı veya slug üzerinden daraltabilirsiniz.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={dialogSearch}
                                    onChange={(e) => setDialogSearch(e.target.value)}
                                    className="pl-9"
                                    placeholder="Kategori ara..."
                                />
                            </div>

                            <div className="grid max-h-[55vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                                <AllProductsCard
                                    selected={!categoryId}
                                    onClick={() => {
                                        onCategoryIdChange("")
                                        setDialogOpen(false)
                                    }}
                                />

                                {filteredDialogCategories.map((category) => (
                                    <ProductCategoryCard
                                        key={category.id}
                                        category={category}
                                        selected={categoryId === category.id}
                                        onClick={() => {
                                            onCategoryIdChange(category.id)
                                            setDialogOpen(false)
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max gap-3">
                    <AllProductsCard
                        selected={!categoryId}
                        onClick={() => onCategoryIdChange("")}
                    />

                    {visibleRailCategories.map((category) => (
                        <ProductCategoryCard
                            key={category.id}
                            category={category}
                            selected={categoryId === category.id}
                            onClick={() => onCategoryIdChange(category.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
