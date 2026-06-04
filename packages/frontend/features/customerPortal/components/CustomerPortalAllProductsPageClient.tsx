"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PackageSearch } from "lucide-react"
import { ProductCard } from "@/components/navigation/ProductCard"
import type { Category } from "@/features/public/categories/types"
import type { ProductAttribute } from "@/features/public/productAttributes/types"
import ProductActiveFilters from "@/features/public/products/components/ProductActiveFilters"
import ProductFilterPagination from "@/features/public/products/components/ProductFilterPagination"
import ProductFilterSidebar from "@/features/public/products/components/ProductFilterSidebar"
import { useProducts } from "@/features/public/products/hooks/useProducts"
import { useFilterStore } from "@/features/public/products/store/filterStore"
import { ProductCategoryFilterRail } from "@/features/admin/products/components/ProductCategoryFilterRail"
import { CustomerPortalPageHeader } from "@/features/customerPortal/components/CustomerPortalPageHeader"
import { CustomerPortalProductGridSkeleton } from "@/features/customerPortal/components/CustomerPortalProductGridSkeleton"
import { CustomerPortalProductsLoadingOverlay } from "@/features/customerPortal/components/CustomerPortalProductsLoadingOverlay"

type Props = {
    categories: Category[]
    attributes: ProductAttribute[]
}

const basePath = "/musteri/tum-urunler"
const INDUSTRIAL_ATTRIBUTE_CODES = new Set(["sector", "production_group", "usage_area"])

export function CustomerPortalAllProductsPageClient({ categories, attributes }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [, startTransition] = useTransition()
    const [navigatingProductId, setNavigatingProductId] = useState<string | null>(null)
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
        const nextParams: Record<string, string | number> = {
            page,
            limit,
        }

        if (categorySlug) {
            nextParams.category = categorySlug
        }

        if (search.trim()) {
            nextParams.search = search.trim()
        }

        Object.entries(selectedAttributes).forEach(([key, values]) => {
            if (!knownAttributeCodes.has(key)) return

            const isIndustrialAttribute = INDUSTRIAL_ATTRIBUTE_CODES.has(key)
            if (categorySlug && isIndustrialAttribute) return
            if (!categorySlug && !isIndustrialAttribute) return

            if (values.length > 0) {
                nextParams[key] = values.join(",")
            }
        })

        return nextParams
    }, [categorySlug, knownAttributeCodes, limit, page, search, selectedAttributes])

    const productsQuery = useProducts(params)
    const products = productsQuery.data?.data ?? []
    const meta = productsQuery.data?.meta
    const isInitialLoading = productsQuery.isLoading && products.length === 0
    const isBackgroundRefetch = productsQuery.isFetching && !isInitialLoading
    const isNavigatingToProductDetail = navigatingProductId !== null

    function handleCategoryIdChange(categoryId: string) {
        const nextCategorySlug = categories.find((item) => item.id === categoryId)?.slug
        const params = new URLSearchParams(searchParams.toString())

        if (nextCategorySlug) {
            params.set("category", nextCategorySlug)
        } else {
            params.delete("category")
        }

        Array.from(params.keys()).forEach((key) => {
            if (!knownAttributeCodes.has(key)) return

            const isIndustrialAttribute = INDUSTRIAL_ATTRIBUTE_CODES.has(key)
            if (nextCategorySlug && isIndustrialAttribute) params.delete(key)
            if (!nextCategorySlug && !isIndustrialAttribute) params.delete(key)
        })

        params.set("page", "1")
        if (!params.get("limit")) {
            params.set("limit", String(limit))
        }

        setFromUrl(new URLSearchParams(params.toString()))

        startTransition(() => {
            router.replace(`${basePath}?${params.toString()}`, { scroll: false })
        })
    }

    return (
        <div className="space-y-4 lg:space-y-5">
            <CustomerPortalPageHeader
                eyebrow="Katalog Tarama"
                icon={PackageSearch}
                title="Tüm Ürünler"
                description="Kategori ve özellik filtreleriyle tüm ürün kataloğunu inceleyin. Bir ürün modeli seçtiğinizde portal içindeki detay sayfasına geçebilirsiniz."
                meta={[
                    { value: `${categories.length}`, label: "kategori" },
                    { value: `${Object.keys(selectedAttributes).length}`, label: "aktif filtre grubu" },
                ]}
            />

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

                <div className="space-y-5 min-w-0">
                    <ProductActiveFilters basePath={basePath} />

                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex flex-col gap-2 border-b border-neutral-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <div
                                    className="text-sm font-semibold text-neutral-900"
                                    aria-live="polite"
                                >
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

                        <div
                            className="relative"
                            aria-busy={isInitialLoading || isBackgroundRefetch || isNavigatingToProductDetail}
                            aria-live="polite"
                        >
                            <span className="sr-only">
                                {isInitialLoading
                                    ? "Ürün listesi ilk kez yükleniyor"
                                    : isNavigatingToProductDetail
                                        ? "Ürün detay sayfası açılıyor"
                                    : isBackgroundRefetch
                                        ? "Ürün listesi filtrelere göre güncelleniyor"
                                        : "Ürün listesi hazır"}
                            </span>

                            {isInitialLoading ? (
                                <div className="min-h-[320px]">
                                    <CustomerPortalProductGridSkeleton />
                                </div>
                            ) : products.length > 0 ? (
                                <div className="relative">
                                    {isBackgroundRefetch || isNavigatingToProductDetail ? (
                                        <CustomerPortalProductsLoadingOverlay
                                            label={
                                                isNavigatingToProductDetail
                                                    ? "Ürün detayı açılıyor"
                                                    : "Ürünler güncelleniyor"
                                            }
                                            description={
                                                isNavigatingToProductDetail
                                                    ? "Seçtiğiniz ürün modeli hazırlanıyor."
                                                    : "Liste yeni seçiminize göre hazırlanıyor."
                                            }
                                        />
                                    ) : null}
                                    <ul className="grid gap-5 transition-[filter,opacity] duration-200 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                                        {products.map((product) => {
                                            const primary = product.assets?.find((asset: { role?: string }) => asset.role === "PRIMARY")
                                            const animated = product.assets?.find((asset: { role?: string }) => asset.role === "ANIMATION")
                                            const fallback = product.assets?.find((asset: { type?: string }) => asset.type === "IMAGE")

                                            return (
                                                <li key={product.id}>
                                                    <ProductCard
                                                        title={product.name}
                                                        code={product.code}
                                                        href={`${basePath}/urun/${product.slug}`}
                                                        imageStatic={primary?.url || fallback?.url || "/placeholder.webp"}
                                                        imageAnimated={animated?.url}
                                                        attributeValues={product.attributeValues}
                                                        onNavigationStart={() => setNavigatingProductId(product.id)}
                                                        navigationPending={navigatingProductId === product.id}
                                                        navigationPendingLabel="Detay hazırlanıyor"
                                                    />
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            ) : (
                                <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
                                    <p className="text-lg font-semibold text-neutral-900">Sonuç bulunamadı</p>
                                    <p className="mt-2 text-sm text-neutral-500">
                                        Filtreleri azaltmayı veya farklı bir kategori seçmeyi deneyin.
                                    </p>
                                </div>
                            )}
                        </div>

                        {isBackgroundRefetch || isNavigatingToProductDetail ? (
                            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-600">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/35" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
                                </span>
                                {isNavigatingToProductDetail
                                    ? "Ürün detay sayfası açılıyor..."
                                    : "Liste filtrelere göre güncelleniyor..."}
                            </div>
                        ) : null}

                        {meta ? (
                            <ProductFilterPagination
                                page={meta.page}
                                totalPages={meta.totalPages}
                                basePath={basePath}
                            />
                        ) : null}
                    </div>

                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="text-sm font-semibold text-neutral-900">Detay Akışı</div>
                        <p className="mt-2 text-sm leading-6 text-neutral-500">
                            Ürün kartına tıkladığınızda model detayına, oradan da varyant detay ekranına geçebilirsiniz.
                            Dilerseniz doğrudan <Link href="/musteri/tanimli-urunler" className="font-medium text-brand hover:underline">İlgili Ürünler</Link>,{" "}
                            <Link href="/musteri/musteriye-tanimli-urunler" className="font-medium text-brand hover:underline">Tanımlı Ürünler</Link> veya{" "}
                            <Link href="/musteri/talepler" className="font-medium text-brand hover:underline">Taleplerim</Link> sekmesine geçebilirsiniz.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
