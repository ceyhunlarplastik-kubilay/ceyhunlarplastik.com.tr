"use client"

import { useTranslations } from "next-intl"
import { ProductCard } from "@/components/navigation/ProductCard"
import type { Product, ProductListPayload } from "@/features/public/products/types"
import { useProducts } from "../hooks/useProducts"
import { useFilterStore } from "../store/filterStore"
import { AnimatePresence } from "motion/react"
import ProductFilterPagination from "./ProductFilterPagination"
import ProductGridSkeleton from "./ProductGridSkeleton"
import ProductActiveFilters from "./ProductActiveFilters"
import { ProductListLoadingOverlay } from "./ProductListLoadingOverlay"

export default function ProductFilterList({
    fixedCategorySlug,
    basePath = "/urunler/filtre",
    initialProducts,
}: {
    fixedCategorySlug?: string
    basePath?: string
    // Server'da (RSC/ISR) çekilen filtresiz ilk sayfa; yalnız default görünümde kullanılır.
    initialProducts?: ProductListPayload | null
}) {
    const t = useTranslations("public.productFilter")
    const { category, search, attributes, page, limit } = useFilterStore()

    const params: Record<string, string | number> = {
        page,
        limit,
        // Katalog kartı DTO'su: filtre sonrası client fetch'i de slim yanıt alır
        // (tam yanıt 113KB → ~19KB / 20 ürün). Portal/admin yüzeyleri bu paramı
        // GÖNDERMEZ; onlar product.category okuduğu için tam yanıtta kalır.
        view: "card",
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

    // initialData YALNIZ filtresiz varsayılan görünüme uygulanmalı; aksi halde filtre/sayfa
    // değişince yeni query key'e yanlışlıkla filtresiz veri seed edilir.
    const hasAttributeFilters = Object.values(attributes).some((values) => values.length > 0)
    const isDefaultView = page === 1 && !search.trim() && !hasAttributeFilters

    const { data, isLoading, isFetching } = useProducts(params, {
        initialData: isDefaultView ? initialProducts ?? undefined : undefined,
    })

    // İlk yükte içerik henüz yok → iskelet. Sonraki filtre/arama/sayfalama isteklerinde
    // TanStack `placeholderData: (prev) => prev` sayesinde eski liste ekranda kalır ve
    // üstüne yerel overlay biner (bkz. ProductListLoadingOverlay).
    if (isLoading) return <ProductGridSkeleton />

    const products = data?.data ?? []
    const meta = data?.meta
    const isEmpty = products.length === 0

    return (
        <div className="relative space-y-6" aria-busy={isFetching}>

            {/* Yerel yükleme geri bildirimi — tam sayfa spinner YOK (AGENTS.md kuralı).
                Eski `fixed top-0` çubuğu kaldırıldı: hem bölüm-yerel değildi hem de
                global navigasyon göstergesiyle (NavigationProgress) aynı yerde çakışıyordu. */}
            <AnimatePresence>
                {isFetching ? <ProductListLoadingOverlay /> : null}
            </AnimatePresence>

            {/* ACTIVE FILTERS — sonuç boş olsa DA gösterilir ki kullanıcı 0 sonuç üreten
                filtreyi görüp kaldırabilsin (önceden boş durumda erken return ediliyordu). */}
            <ProductActiveFilters basePath={basePath} />

            {isEmpty ? (
                <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
                    <p className="text-lg font-semibold text-neutral-900">
                        {t("noResultsTitle")}
                    </p>
                    <p className="mt-2 text-sm text-neutral-500">
                        {t("noResultsSubtitle")}
                    </p>
                </div>
            ) : (
                <>

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
                </>
            )}
        </div>
    )
}
