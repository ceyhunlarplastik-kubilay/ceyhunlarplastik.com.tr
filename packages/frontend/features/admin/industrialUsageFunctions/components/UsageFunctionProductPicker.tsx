"use client"

import Image from "next/image"
import { useDeferredValue, useMemo, useState } from "react"
import { Check, ImageIcon, Loader2, Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Category } from "@/features/public/categories/types"
import type { Product } from "@/features/public/products/types"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { ProductCategoryFilterRail } from "@/features/admin/products/components/ProductCategoryFilterRail"
import { useProducts } from "@/features/admin/products/hooks/useProducts"

export type UsageFunctionPickerProduct = {
    id: string
    code: string
    name: string
}

type ProductAssetLite = {
    type?: string
    role?: string
    url?: string
}

/** Ürün listesi kart görünümü: aynı öncelik sırası ProductsTable ile ortak. */
function pickThumb(product: Product) {
    const assets = (product.assets ?? []) as ProductAssetLite[]

    const primary = assets.find((asset) => asset.role === "PRIMARY" && asset.type === "IMAGE")
    if (primary?.url) return primary.url

    const animation = assets.find((asset) => asset.role === "ANIMATION" && asset.type === "IMAGE")
    if (animation?.url) return animation.url

    return assets.find((asset) => asset.type === "IMAGE")?.url ?? null
}

type Props = {
    categories: Category[]
    selectedProductId: string | null
    onSelect: (product: UsageFunctionPickerProduct) => void
}

export function UsageFunctionProductPicker({
    categories,
    selectedProductId,
    onSelect,
}: Props) {
    const [search, setSearch] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(12)
    const deferredSearch = useDeferredValue(search)

    const params = useMemo(
        () => ({
            page,
            limit,
            ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
            ...(categoryId ? { categoryId } : {}),
        }),
        [categoryId, deferredSearch, limit, page],
    )

    const productsQuery = useProducts({ params })
    const products = productsQuery.data?.data ?? []
    const meta = productsQuery.data?.meta
    const isInitialLoading = productsQuery.isLoading && products.length === 0
    const isBackgroundRefetch = productsQuery.isFetching && !isInitialLoading

    const selectedCategoryName = useMemo(
        () => categories.find((category) => category.id === categoryId)?.name ?? null,
        [categories, categoryId],
    )

    function handleCategoryIdChange(nextCategoryId: string) {
        setCategoryId(nextCategoryId)
        setPage(1)
    }

    function handleSearchChange(value: string) {
        setSearch(value)
        setPage(1)
    }

    function clearFilters() {
        setSearch("")
        setCategoryId("")
        setPage(1)
    }

    const hasFilters = Boolean(search.trim() || categoryId)

    return (
        <section className="space-y-4">
            <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-950">Ürün Modeli Seçin</h2>
                        <p className="text-sm text-neutral-500">
                            Kullanım fonksiyonları ürün modeli bazında aktarılır — her dosya tek bir modele aittir.
                        </p>
                    </div>

                    <div className="flex w-full items-center gap-2 lg:max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                            <Input
                                value={search}
                                onChange={(event) => handleSearchChange(event.target.value)}
                                placeholder="Ürün kodu veya adı ara"
                                className="h-11 rounded-2xl pl-9"
                            />
                            {isBackgroundRefetch ? (
                                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />
                            ) : null}
                        </div>

                        {hasFilters ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 rounded-2xl"
                                onClick={clearFilters}
                            >
                                <X className="h-4 w-4" />
                                Temizle
                            </Button>
                        ) : null}
                    </div>
                </div>

                {selectedCategoryName ? (
                    <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                        <Badge variant="outline" className="rounded-full font-normal">
                            {selectedCategoryName}
                        </Badge>
                        kategorisine göre filtrelenmiş
                    </div>
                ) : null}
            </div>

            <ProductCategoryFilterRail
                categories={categories}
                categoryId={categoryId}
                onCategoryIdChange={handleCategoryIdChange}
            />

            <div className="relative rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div
                    aria-busy={isBackgroundRefetch}
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    {isInitialLoading
                        ? Array.from({ length: 8 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-[236px] animate-pulse rounded-2xl border border-neutral-100 bg-neutral-50"
                            />
                        ))
                        : products.map((product) => {
                            const isSelected = product.id === selectedProductId
                            const thumb = pickThumb(product)

                            return (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() =>
                                        onSelect({
                                            id: product.id,
                                            code: product.code,
                                            name: product.name,
                                        })
                                    }
                                    className={cn(
                                        "group flex flex-col overflow-hidden rounded-2xl border text-start transition",
                                        isSelected
                                            ? "border-2 border-brand bg-brand/5 shadow-sm"
                                            : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm",
                                    )}
                                >
                                    <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-50">
                                        {thumb ? (
                                            <Image
                                                src={thumb}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
                                                className="object-contain p-3 transition group-hover:scale-[1.03]"
                                            />
                                        ) : (
                                            <div className="grid h-full place-items-center text-neutral-300">
                                                <ImageIcon className="h-8 w-8" />
                                            </div>
                                        )}

                                        {isSelected ? (
                                            <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-brand text-white shadow">
                                                <Check className="h-4 w-4" />
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-1 flex-col gap-1 border-t border-neutral-100 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-xs font-semibold text-neutral-950">
                                                {product.code}
                                            </span>
                                            {product.category?.name ? (
                                                <span className="truncate text-[11px] text-neutral-400">
                                                    {product.category.name}
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="line-clamp-2 text-sm font-medium leading-5 text-neutral-700">
                                            {product.name}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                </div>

                {!isInitialLoading && products.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
                        Aramanıza uyan ürün bulunamadı.
                    </p>
                ) : null}

                {products.length > 0 ? (
                    <AdminListPagination
                        page={meta?.page ?? page}
                        totalPages={meta?.totalPages ?? 1}
                        total={meta?.total ?? 0}
                        limit={limit}
                        itemLabel="ürün"
                        onPageChange={setPage}
                        onLimitChange={(nextLimit) => {
                            setLimit(nextLimit)
                            setPage(1)
                        }}
                    />
                ) : null}
            </div>
        </section>
    )
}
