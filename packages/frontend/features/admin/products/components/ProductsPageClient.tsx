"use client"

import { useProducts } from "@/features/admin/products/hooks/useProducts"
import { ProductsTable } from "@/features/admin/products/components/ProductsTable"

import type { Category } from "@/features/public/categories/types"

type Props = {
    categories: Category[]
}

export function ProductsPageClient({ categories }: Props) {

    const { data, isLoading, isError } = useProducts()

    if (isLoading) return <div>Loading...</div>
    if (isError) return <div>Error loading products</div>

    return (
        <ProductsTable
            initialData={data ?? []}
            categories={categories}
        />
    )
}
