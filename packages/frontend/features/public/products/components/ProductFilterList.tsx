"use client"

import { useTranslations } from "next-intl"
import { ProductCard } from "@/components/navigation/ProductCard"
import type { Product } from "@/features/public/products/types"
import { useProducts } from "../hooks/useProducts"
import { useFilterStore } from "../store/filterStore"
import ProductFilterPagination from "./ProductFilterPagination"
import ProductGridSkeleton from "./ProductGridSkeleton"
import ProductActiveFilters from "./ProductActiveFilters"

export default function ProductFilterList({
    fixedCategorySlug,
    basePath = "/urunler/filtre",
}: {
    fixedCategorySlug?: string
    basePath?: string
}) {
    const t = useTranslations("public.productFilter")
    const { category, search, attributes, page, limit } = useFilterStore()

    const params: Record<string, string | number> = {
        page,
        limit,
    }

    if (fixedCategorySlug) {
        params.category = fixedCategorySlug
    } else if (category) {
        params.category = category
    }

    if (search.trim()) {
        params.search = search.trim()
    }

    // 🔥 attributes flatten
    Object.entries(attributes).forEach(([key, values]) => {
        if (values.length) {
            params[key] = values.join(",")
        }
    })

    const { data, isLoading, isFetching } = useProducts(params)

    if (isLoading) return <ProductGridSkeleton />

    const products = data?.data ?? []
    const meta = data?.meta

    if (!products.length) {
        return (
            <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
                <p className="text-lg font-semibold text-neutral-900">
                    {t("noResultsTitle")}
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                    {t("noResultsSubtitle")}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">

            {/* ACTIVE FILTERS */}
            <ProductActiveFilters basePath={basePath} />

            {/* HEADER */}
            <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
                <div>
                    <p className="text-sm font-medium">
                        {t("countFound", { count: meta?.total ?? 0 })}
                    </p>
                    <p className="text-xs text-neutral-500">
                        {t("perPage", { limit: meta?.limit ?? 0 })}
                    </p>
                </div>
            </div>

            {/* LOADING BAR */}
            {isFetching && (
                <div className="fixed top-0 left-0 w-full h-1 bg-brand animate-pulse z-50" />
            )}

            {/* GRID */}
            <ul className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product: Product) => {
                    const primary = product.assets?.find((a: { role?: string }) => a.role === "PRIMARY")
                    const fallback = product.assets?.find((a: { type?: string }) => a.type === "IMAGE")

                    const img = primary?.url || fallback?.url || "/placeholder.webp"

                    return (
                        <li key={product.id}>
                            <ProductCard
                                title={product.name}
                                code={product.code}
                                href={`/urun/${product.slug}`}
                                imageStatic={img}
                                attributeValues={product.attributeValues}
                            />
                        </li>
                    )
                })}
            </ul>

            {/* PAGINATION */}
            {meta && (
                <ProductFilterPagination
                    page={meta.page}
                    totalPages={meta.totalPages}
                    basePath={basePath}
                />
            )}
        </div>
    )
}
