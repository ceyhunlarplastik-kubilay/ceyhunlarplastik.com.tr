"use client"

import Link from "next/link"
import { useEffect, useMemo, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ProductCard } from "@/components/navigation/ProductCard"
import { Spinner } from "@/components/ui/spinner"
import type { Category } from "@/features/public/categories/types"
import type { ProductAttribute } from "@/features/public/productAttributes/types"
import ProductActiveFilters from "@/features/public/products/components/ProductActiveFilters"
import ProductFilterPagination from "@/features/public/products/components/ProductFilterPagination"
import ProductFilterSidebar from "@/features/public/products/components/ProductFilterSidebar"
import { useProducts } from "@/features/public/products/hooks/useProducts"
import { useFilterStore } from "@/features/public/products/store/filterStore"
import { ProductCategoryFilterRail } from "@/features/admin/products/components/ProductCategoryFilterRail"

type Props = {
    categories: Category[]
    attributes: ProductAttribute[]
}

const basePath = "/musteri/tum-urunler"

export function CustomerPortalAllProductsPageClient({ categories, attributes }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [, startTransition] = useTransition()
    const { category, attributes: selectedAttributes, page, limit, setFromUrl } = useFilterStore()

    useEffect(() => {
        setFromUrl(new URLSearchParams(searchParams.toString()))
    }, [searchParams, setFromUrl])

    const categorySlug = searchParams.get("category") ?? category
    const selectedCategory = useMemo(
        () => categories.find((item) => item.slug === categorySlug),
        [categories, categorySlug],
    )

    const params = useMemo(() => {
        const nextParams: Record<string, string | number> = {
            page,
            limit,
        }

        if (categorySlug) {
            nextParams.category = categorySlug
        }

        Object.entries(selectedAttributes).forEach(([key, values]) => {
            if (values.length > 0) {
                nextParams[key] = values.join(",")
            }
        })

        return nextParams
    }, [categorySlug, limit, page, selectedAttributes])

    const productsQuery = useProducts(params)
    const products = productsQuery.data?.data ?? []
    const meta = productsQuery.data?.meta

    function handleCategoryIdChange(categoryId: string) {
        const nextCategorySlug = categories.find((item) => item.id === categoryId)?.slug
        const params = new URLSearchParams(searchParams.toString())

        if (nextCategorySlug) {
            params.set("category", nextCategorySlug)
        } else {
            params.delete("category")
        }

        params.set("page", "1")
        if (!params.get("limit")) {
            params.set("limit", String(limit))
        }

        startTransition(() => {
            router.replace(`${basePath}?${params.toString()}`, { scroll: false })
        })
    }

    return (
        <div className="space-y-6">
            <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm lg:p-8">
                <div className="space-y-3">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Tüm Ürünler</h1>
                    <p className="max-w-3xl text-sm leading-6 text-neutral-500">
                        Kategori ve özellik filtreleriyle tüm ürün kataloğunu inceleyin. Bir ürün modeli seçtiğinizde portal içindeki detay sayfasına geçebilirsiniz.
                    </p>
                </div>
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm lg:p-6">
                <ProductCategoryFilterRail
                    categories={categories}
                    categoryId={selectedCategory?.id ?? ""}
                    onCategoryIdChange={handleCategoryIdChange}
                />
            </div>

            <div className="grid gap-6 2xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="min-w-0">
                    <ProductFilterSidebar
                        categories={categories}
                        attributes={attributes}
                        hideCategoryFilter
                        fixedCategorySlug={categorySlug}
                        basePath={basePath}
                    />
                </div>

                <div className="space-y-6 min-w-0">
                    <ProductActiveFilters basePath={basePath} />

                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 flex flex-col gap-2 border-b border-neutral-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <div className="text-sm font-semibold text-neutral-900">
                                    {productsQuery.isLoading ? "Ürünler yükleniyor" : `${meta?.total ?? 0} ürün bulundu`}
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

                        {productsQuery.isLoading ? (
                            <div className="flex min-h-[320px] items-center justify-center">
                                <Spinner className="size-5" />
                            </div>
                        ) : products.length > 0 ? (
                            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
                                            />
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
                                <p className="text-lg font-semibold text-neutral-900">Sonuç bulunamadı</p>
                                <p className="mt-2 text-sm text-neutral-500">
                                    Filtreleri azaltmayı veya farklı bir kategori seçmeyi deneyin.
                                </p>
                            </div>
                        )}

                        {productsQuery.isFetching && !productsQuery.isLoading ? (
                            <div className="mt-4 inline-flex items-center gap-2 text-sm text-neutral-500">
                                <Spinner className="size-4" />
                                Liste güncelleniyor...
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
