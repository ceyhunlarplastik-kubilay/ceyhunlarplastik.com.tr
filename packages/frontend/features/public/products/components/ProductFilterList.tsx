"use client"

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
    const { category, attributes, page, limit } = useFilterStore()

    const params: Record<string, string | number> = {
        page,
        limit,
    }

    if (fixedCategorySlug) {
        params.category = fixedCategorySlug
    } else if (category) {
        params.category = category
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
                    Sonuç bulunamadı
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                    Filtreleri azaltmayı deneyin
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
                        {meta?.total} ürün bulundu
                    </p>
                    <p className="text-xs text-neutral-500">
                        Sayfa başına {meta?.limit}
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




/* import { getFilteredProducts } from "@/features/public/products/server/getFilteredProducts"
import { ProductCard } from "@/components/navigation/ProductCard"
import { getCategories } from "@/features/public/categories/server/getCategories"
import { getAttributesForFilter } from "@/features/admin/productAttributes/server/getAttributesForFilter"
import ProductFilterPagination from "@/features/public/products/components/ProductFilterPagination"
import ProductActiveFilters from "@/features/public/products/components/ProductActiveFilters"

type Props = {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

type Attribute = {
    id: string
    code: string
    name: string
    values: {
        id: string
        slug: string
    }[]
}

export default async function ProductFilterList({ searchParams }: Props) {
    const resolvedParams = await searchParams
    const categories = await getCategories()
    const attributes = await getAttributesForFilter() as Attribute[]

    let categoryId: string | undefined

    if (typeof resolvedParams.category === "string" && resolvedParams.category) {
        const found = categories.find((c: any) => c.slug === resolvedParams.category)
        categoryId = found?.id
    }

    const selectedAttributeValueIds: string[] = []

    for (const attr of attributes) {
        const raw = resolvedParams[attr.code]

        if (!raw) continue

        const slugs =
            typeof raw === "string"
                ? raw.split(",").filter(Boolean)
                : raw.flatMap((item) => item.split(",").filter(Boolean))

        const matchedIds = attr.values
            .filter((val: any) => slugs.includes(val.slug))
            .map((val: any) => val.id)

        selectedAttributeValueIds.push(...matchedIds)
    }

    const page =
        typeof resolvedParams.page === "string" && Number(resolvedParams.page) > 0
            ? Number(resolvedParams.page)
            : 1

    const limit =
        typeof resolvedParams.limit === "string" && Number(resolvedParams.limit) > 0
            ? Number(resolvedParams.limit)
            : 12

    const result = await getFilteredProducts({
        categoryId,
        attributeValueIds: selectedAttributeValueIds.join(","),
        page,
        limit,
    })

    const products = result.data
    const meta = result.meta

    if (products.length === 0) {
        return (
            <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
                <p className="text-lg font-semibold text-neutral-900">
                    Sonuç bulunamadı
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                    Seçtiğiniz filtrelere uygun ürün bulunamadı. Filtreleri azaltmayı deneyin.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <ProductActiveFilters />
            <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                <div>
                    <p className="text-sm font-medium text-neutral-900">
                        {meta.total} ürün bulundu
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                        Sayfa başına {meta.limit} ürün gösteriliyor
                    </p>
                </div>
            </div>

            <ul className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product: any) => {
                    const primaryAsset = product.assets?.find((a: any) => a.role === "PRIMARY")
                    const animatedAsset = product.assets?.find((a: any) => a.role === "ANIMATION")
                    const fallbackAsset = product.assets?.find((a: any) => a.type === "IMAGE")

                    const staticImg =
                        primaryAsset?.url ||
                        fallbackAsset?.url ||
                        "/placeholder.webp"

                    const animImg = animatedAsset?.url

                    return (
                        <li key={product.id}>
                            <ProductCard
                                title={product.name}
                                code={product.code}
                                href={`/urun/${product.slug}`}
                                imageStatic={staticImg}
                                imageAnimated={animImg}
                            >
                                {product.name}
                            </ProductCard>
                        </li>
                    )
                })}
            </ul>

            <ProductFilterPagination
                page={meta.page}
                totalPages={meta.totalPages}
            />
        </div>
    )
}
 */
