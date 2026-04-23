"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomers } from "@/features/admin/customers/api/getCustomers"

type Params = {
    page: number
    limit: number
    search?: string
    sectorValueId?: string
    productionGroupValueId?: string
    usageAreaValueId?: string
}

export function useCustomers(params: Params) {
    return useQuery({
        queryKey: ["admin-customers", params],
        queryFn: () => getCustomers(params),
    })
}
