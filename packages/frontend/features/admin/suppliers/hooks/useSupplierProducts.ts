"use client"

import { useQuery } from "@tanstack/react-query"
import { getSupplierProducts } from "@/features/admin/suppliers/api/getSupplierProducts"

type Params = {
    supplierId?: string
    page: number
    limit: number
    search?: string
    categoryId?: string
    sort?: string
    order?: "asc" | "desc"
}

export function useSupplierProducts(params: Params) {
    return useQuery({
        queryKey: ["admin-supplier-products", params],
        queryFn: () =>
            getSupplierProducts({
                supplierId: params.supplierId as string,
                page: params.page,
                limit: params.limit,
                ...(params.search ? { search: params.search } : {}),
                ...(params.categoryId ? { categoryId: params.categoryId } : {}),
                ...(params.sort ? { sort: params.sort } : {}),
                ...(params.order ? { order: params.order } : {}),
            }),
        enabled: Boolean(params.supplierId),
    })
}

