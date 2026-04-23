"use client"

import { useQuery } from "@tanstack/react-query"
import { getSuppliers } from "@/features/admin/suppliers/api/getSuppliers"

type Params = {
    page: number
    limit: number
    search?: string
}

export function useSuppliers(params: Params) {
    return useQuery({
        queryKey: ["admin-suppliers", params],
        queryFn: () => getSuppliers(params),
    })
}
