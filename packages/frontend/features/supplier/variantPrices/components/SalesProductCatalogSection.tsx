"use client"

import { useEffect, useMemo, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence } from "motion/react"
import { Layers, PackageSearch, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/navigation/ProductCard"
import type { Category } from "@/features/public/categories/types"
import type { ProductAttribute } from "@/features/public/productAttributes/types"
import ProductActiveFilters from "@/features/public/products/components/ProductActiveFilters"
import ProductFilterPagination from "@/features/public/products/components/ProductFilterPagination"
import ProductFilterSidebar from "@/features/public/products/components/ProductFilterSidebar"
import { ProductListLoadingOverlay } from "@/features/public/products/components/ProductListLoadingOverlay"
import { useProducts } from "@/features/public/products/hooks/useProducts"
import { useFilterStore } from "@/features/public/products/store/filterStore"
import { ProductCategoryFilterRail } from "@/features/admin/products/components/ProductCategoryFilterRail"

const basePath = "/satis/urunler"
const INDUSTRIAL_ATTRIBUTE_CODES = new Set(["sector", "production_group", "usage_area"])

type Props = {
    categories: Category[]
    attributes: ProductAttribute[]
    /** Şu an "Varyantlar" panelinde açık olan ürün — kartta vurgu için. */
    selectedProductId: string
    onSelectVariants: (productId: string, productName: string) => void
    onSelectCustomers: (product: { id: string; code: string; name: string }) => void
}

/**
 * `/satis/urunler` katalog gövdesi — kullanıcı talebiyle müşteri portalının
 * ürün listesiyle (`CustomerPortalAllProductsPageClient`) AYNI veri kaynağı
 * (public `/products` ucu, `useProducts`) ve AYNI filtre mekanizması
 * (`useFilterStore` + `ProductCategoryFilterRail` + `ProductFilterSidebar`)
 * kullanılır — böylece varyantı/tedarikçi fiyatı HENÜZ girilmemiş ürünler de
 * (eski `useSupplierProducts` bunları görünmez kılıyordu, çünkü o uç yalnız
 * `ProductVariantSupplier` satırı olan ürünleri döndürür) listede görünür.
 * Portaldan FARKLI: burada bir "ürün detay sayfası" yok — kart tıklaması ve
 * "Varyantlar"/"Müşteriler" düğmeleri, aynı sayfadaki mevcut panelleri açar
 * (üst bileşendeki state'i callback'lerle sürer).
 */
export function SalesProductCatalogSection({
    categories,
    attributes,
    selectedProductId,
    onSelectVariants,
    onSelectCustomers,
}: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [, startTransition] = useTransition()
    const { category, search, attributes: selectedAttributes, page, limit, setFromUrl } = useFilterStore()

    useEffect(() => {
        setFromUrl(new URLSearchParams(searchParams.toString()))
    }, [searchParams, setFromUrl])

    const categorySlug = searchParams.get("category") ?? category
    const selectedCategory = useMemo(
        () => categories.find((item) => item.slug === categorySlug),
        [categories, categorySlug],
    )
    const knownAttributeCodes = useMemo(
        () => new Set(attributes.map((attribute) => attribute.code)),
        [attributes],
    )

    const params = useMemo(() => {
        const nextParams: Record<string, string | number> = { page, limit }

        if (categorySlug) nextParams.category = categorySlug
        if (search.trim()) nextParams.search = search.trim()

        Object.entries(selectedAttributes).forEach(([key, values]) => {
            if (!knownAttributeCodes.has(key)) return

            const isIndustrialAttribute = INDUSTRIAL_ATTRIBUTE_CODES.has(key)
            if (categorySlug && isIndustrialAttribute) return
            if (!categorySlug && !isIndustrialAttribute) return

            if (values.length > 0) nextParams[key] = values.join(",")
        })

        return nextParams
    }, [categorySlug, knownAttributeCodes, limit, page, search, selectedAttributes])

    const productsQuery = useProducts(params)
    const products = productsQuery.data?.data ?? []
    const meta = productsQuery.data?.meta
    const isInitialLoading = productsQuery.isLoading && products.length === 0
    const isBackgroundRefetch = productsQuery.isFetching && !isInitialLoading

    function handleCategoryIdChange(categoryId: string) {
        const nextCategorySlug = categories.find((item) => item.id === categoryId)?.slug
        const nextParams = new URLSearchParams(searchParams.toString())

        if (nextCategorySlug) {
            nextParams.set("category", nextCategorySlug)
        } else {
            nextParams.delete("category")
        }

        Array.from(nextParams.keys()).forEach((key) => {
            if (!knownAttributeCodes.has(key)) return

            const isIndustrialAttribute = INDUSTRIAL_ATTRIBUTE_CODES.has(key)
            if (nextCategorySlug && isIndustrialAttribute) nextParams.delete(key)
            if (!nextCategorySlug && !isIndustrialAttribute) nextParams.delete(key)
        })

        nextParams.set("page", "1")
        if (!nextParams.get("limit")) {
            nextParams.set("limit", String(limit))
        }

        setFromUrl(new URLSearchParams(nextParams.toString()))

        startTransition(() => {
            router.replace(`${basePath}?${nextParams.toString()}`, { scroll: false })
        })
    }

    return (
        <div className="space-y-4 lg:space-y-5">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm lg:p-5">
                <ProductCategoryFilterRail
                    categories={categories}
                    categoryId={selectedCategory?.id ?? ""}
                    onCategoryIdChange={handleCategoryIdChange}
                    railMode="all"
                />
            </div>

            <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="min-w-0">
                    <ProductFilterSidebar
                        categories={categories}
                        attributes={attributes}
                        lazyIndustrialAttributes
                        hideCategoryFilter
                        fixedCategorySlug={categorySlug}
                        basePath={basePath}
                        showSelectedCategoryPreview
                        showProductSearch
                        productSearchPlaceholder="Ürün kodu veya adı ara"
                        attributeSelectorVariant="popover"
                        showProductFiltersOnlyWhenCategorySelected
                        hideIndustrialFiltersWhenCategorySelected
                    />
                </div>

                <div className="min-w-0 space-y-5">
                    <ProductActiveFilters basePath={basePath} />

                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex flex-col gap-2 border-b border-neutral-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <div className="text-sm font-semibold text-neutral-900" aria-live="polite">
                                    {isInitialLoading ? "Ürünler hazırlanıyor" : `${meta?.total ?? 0} ürün bulundu`}
                                </div>
                                <div className="mt-1 text-xs text-neutral-500">
                                    {selectedCategory
                                        ? `${selectedCategory.name} kategorisi için filtrelenmiş sonuçlar`
                                        : "Tüm kategorilerden sonuçlar"}
                                </div>
                            </div>
                            <div className="text-xs text-neutral-400">
                                Sayfa başına {meta?.limit ?? limit} ürün
                            </div>
                        </div>

                        <div className="relative">
                            {isInitialLoading ? (
                                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                                    {Array.from({ length: 8 }).map((_, index) => (
                                        <div key={index} className="aspect-3/4 animate-pulse rounded-xl bg-neutral-100" />
                                    ))}
                                </div>
                            ) : products.length > 0 ? (
                                <>
                                    <AnimatePresence>
                                        {isBackgroundRefetch ? <ProductListLoadingOverlay /> : null}
                                    </AnimatePresence>
                                    <ul className="grid gap-5 transition-[filter,opacity] duration-200 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                                        {products.map((product) => {
                                            const primary = product.assets?.find((asset: { role?: string }) => asset.role === "PRIMARY")
                                            const animated = product.assets?.find((asset: { role?: string }) => asset.role === "ANIMATION")
                                            const fallback = product.assets?.find((asset: { type?: string }) => asset.type === "IMAGE")
                                            const isSelected = selectedProductId === product.id

                                            return (
                                                <li key={product.id}>
                                                    <ProductCard
                                                        title={product.name}
                                                        code={product.code}
                                                        href="#"
                                                        imageStatic={primary?.url || fallback?.url || "/placeholder.webp"}
                                                        imageAnimated={animated?.url}
                                                        attributeValues={product.attributeValues}
                                                        isNew={product.isNew}
                                                        hasNewVariant={product.hasNewVariant}
                                                        onCardClick={() => onSelectVariants(product.id, product.name)}
                                                        actions={(
                                                            <>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant={isSelected ? "default" : "outline"}
                                                                    className="flex-1 gap-1.5 rounded-xl"
                                                                    onClick={() => onSelectVariants(product.id, product.name)}
                                                                >
                                                                    <Layers className="h-3.5 w-3.5" />
                                                                    Varyantlar
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="flex-1 gap-1.5 rounded-xl"
                                                                    onClick={() => onSelectCustomers({
                                                                        id: product.id,
                                                                        code: product.code,
                                                                        name: product.name,
                                                                    })}
                                                                >
                                                                    <Users className="h-3.5 w-3.5" />
                                                                    Müşteriler
                                                                </Button>
                                                            </>
                                                        )}
                                                    />
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </>
                            ) : (
                                <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
                                    <PackageSearch className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
                                    <p className="text-lg font-semibold text-neutral-900">Sonuç bulunamadı</p>
                                    <p className="mt-2 text-sm text-neutral-500">
                                        Filtreleri azaltmayı veya farklı bir kategori seçmeyi deneyin.
                                    </p>
                                </div>
                            )}
                        </div>

                        {meta ? (
                            <div className="mt-4">
                                <ProductFilterPagination page={meta.page} totalPages={meta.totalPages} basePath={basePath} />
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}
