"use client"

import { useQuery } from "@tanstack/react-query"
import { getSupplierApprovalRequests } from "@/features/supplier/approvalRequests/api/getSupplierApprovalRequests"

type Params = {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    status?: string
    type?: string
    enabled?: boolean
}

export function useSupplierApprovalRequests(params: Params = {}) {
    const { enabled = true, ...query } = params

    return useQuery({
        queryKey: ["supplier-approval-requests", query],
        queryFn: () => getSupplierApprovalRequests(query),
        enabled,
    })
}
