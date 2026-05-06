"use client"

import { useProductListFilters } from "@/features/admin/products/hooks/useProductListFilters"
import { useProducts } from "@/features/admin/products/hooks/useProducts"
import { ProductsTable } from "@/features/admin/products/components/ProductsTable"

import type { Category } from "@/features/public/categories/types"

type Props = {
    categories: Category[]
}

export function ProductsPageClient({ categories }: Props) {
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
        />
    )
}
