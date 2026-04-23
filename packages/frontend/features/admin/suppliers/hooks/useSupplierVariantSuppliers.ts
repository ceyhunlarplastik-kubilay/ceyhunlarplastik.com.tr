"use client"

import { useQuery } from "@tanstack/react-query"
import { getSupplierVariantSuppliers } from "@/features/admin/suppliers/api/getSupplierVariantSuppliers"

type Params = {
    supplierId?: string
    page: number
    limit: number
}

export function useSupplierVariantSuppliers(params: Params) {
    return useQuery({
        queryKey: ["admin-supplier-variant-suppliers", params],
        queryFn: () =>
            getSupplierVariantSuppliers({
                supplierId: params.supplierId as string,
                page: params.page,
                limit: params.limit,
            }),
        enabled: Boolean(params.supplierId),
    })
}
