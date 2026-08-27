"use client"

import { useState } from "react"

import { ProductMatchedCustomersPanel } from "@/features/productMatchedCustomers/components/ProductMatchedCustomersPanel"
import { useProductListFilters } from "@/features/admin/products/hooks/useProductListFilters"
import { useProducts } from "@/features/admin/products/hooks/useProducts"
import { ProductsTable } from "@/features/admin/products/components/ProductsTable"

import type { Category } from "@/features/public/categories/types"

type MatchedCustomersProduct = {
    id: string
    code: string
    name: string
}

type Props = {
    categories: Category[]
    showVariantsLink?: boolean
    variantsBasePath?: string
    /**
     * Ürün → müşteri eşleşme paneli. Varsayılan KAPALI: bu bileşen veri girişi
     * panelinde de kullanılıyor ve `content_editor` ticari CRM verisi görmemeli.
     */
    showMatchedCustomers?: boolean
}

export function ProductsPageClient({
    categories,
    showVariantsLink = true,
    variantsBasePath = "/admin/products",
    showMatchedCustomers = false,
}: Props) {
    const [customersProduct, setCustomersProduct] = useState<MatchedCustomersProduct | null>(null)
    const {
        filters,
        params,
        setSearch,
        setCategoryId,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
    } = useProductListFilters()

    const { data, isLoading, isError, isFetching, refetch, dataUpdatedAt } = useProducts({
        params,
        autoRefreshIntervalMs: filters.refreshIntervalSeconds > 0
            ? filters.refreshIntervalSeconds * 1000
            : false,
    })

    if (isLoading) return <div>Loading...</div>
    if (isError) return <div>Error loading products</div>

    return (
        <div className="space-y-6">
            <ProductsTable
                products={data?.data ?? []}
                meta={data?.meta}
                categories={categories}
                searchQuery={filters.search}
                onSearchQueryChange={setSearch}
                categoryId={filters.categoryId}
                onCategoryIdChange={setCategoryId}
                page={filters.page}
                onPageChange={setPage}
                limit={filters.limit}
                onLimitChange={setLimit}
                isFetching={isFetching}
                dataUpdatedAt={dataUpdatedAt}
                onRefresh={() => void refetch()}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
                showVariantsLink={showVariantsLink}
                variantsBasePath={variantsBasePath}
                onViewCustomers={showMatchedCustomers
                    ? (product) => setCustomersProduct({
                        id: product.id,
                        code: product.code,
                        name: product.name,
                    })
                    : undefined}
                customersProductId={customersProduct?.id}
            />

            {showMatchedCustomers && customersProduct ? (
                <ProductMatchedCustomersPanel
                    scope="admin"
                    productId={customersProduct.id}
                    productCode={customersProduct.code}
                    productName={customersProduct.name}
                    onClose={() => setCustomersProduct(null)}
                />
            ) : null}
        </div>
    )
}
