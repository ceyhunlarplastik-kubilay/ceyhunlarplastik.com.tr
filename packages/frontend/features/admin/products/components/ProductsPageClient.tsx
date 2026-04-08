"use client"

import { useMemo, useState } from "react"
import { useProducts } from "@/features/admin/products/hooks/useProducts"
import { ProductsTable } from "@/features/admin/products/components/ProductsTable"

import type { Category } from "@/features/public/categories/types"

type Props = {
    categories: Category[]
}

export function ProductsPageClient({ categories }: Props) {

    const [search, setSearch] = useState("")
    const [categoryId, setCategoryId] = useState<string | undefined>(undefined)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)

    const params = useMemo(
        () => ({
            page,
            limit,
            ...(search.trim() ? { search: search.trim() } : {}),
            ...(categoryId ? { categoryId } : {}),
        }),
        [page, limit, search, categoryId]
    )

    const { data, isLoading, isError, isFetching } = useProducts(params)

    if (isLoading) return <div>Loading...</div>
    if (isError) return <div>Error loading products</div>

    return (
        <ProductsTable
            products={data?.data ?? []}
            meta={data?.meta}
            categories={categories}
            searchQuery={search}
            onSearchQueryChange={(next) => {
                setSearch(next)
                setPage(1)
            }}
            categoryId={categoryId}
            onCategoryIdChange={(next) => {
                setCategoryId(next)
                setPage(1)
            }}
            page={page}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(next) => {
                setLimit(next)
                setPage(1)
            }}
            isFetching={isFetching}
        />
    )
}
