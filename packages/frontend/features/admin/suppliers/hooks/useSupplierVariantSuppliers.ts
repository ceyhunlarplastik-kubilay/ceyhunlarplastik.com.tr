"use client"

import { useQuery } from "@tanstack/react-query"
import { getSupplierVariantSuppliers } from "@/features/admin/suppliers/api/getSupplierVariantSuppliers"

type Params = {
    supplierId?: string
    page: number
    limit: number
    search?: string
    categoryId?: string
    productId?: string
    sort?: string
    order?: "asc" | "desc"
}

export function useSupplierVariantSuppliers(params: Params) {
    return useQuery({
        queryKey: ["admin-supplier-variant-suppliers", params],
        queryFn: () =>
            getSupplierVariantSuppliers({
                supplierId: params.supplierId as string,
                page: params.page,
                limit: params.limit,
                ...(params.search ? { search: params.search } : {}),
                ...(params.categoryId ? { categoryId: params.categoryId } : {}),
                ...(params.productId ? { productId: params.productId } : {}),
                ...(params.sort ? { sort: params.sort } : {}),
                ...(params.order ? { order: params.order } : {}),
            }),
        enabled: Boolean(params.supplierId),
    })
}
