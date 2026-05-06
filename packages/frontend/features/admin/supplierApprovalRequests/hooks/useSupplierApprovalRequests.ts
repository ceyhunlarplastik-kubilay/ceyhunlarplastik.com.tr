"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getSupplierApprovalRequests } from "@/features/admin/supplierApprovalRequests/api/getSupplierApprovalRequests"

type Params = {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    status?: string
    type?: string
    supplierId?: string
}

const supplierApprovalRequestParamsSchema = z.object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    sort: z.string().trim().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    type: z.enum(["SUPPLIER_PROFILE_UPDATE", "VARIANT_PRICING_UPDATE"]).optional(),
    supplierId: z.string().trim().optional(),
})

type Options = {
    params?: Params
    autoRefreshIntervalMs?: number | false
}

export function useSupplierApprovalRequests({ params = {}, autoRefreshIntervalMs = false }: Options = {}) {
    const normalizedParams = useMemo(
        () => supplierApprovalRequestParamsSchema.parse(params),
        [params]
    )

    return useQuery({
        queryKey: ["admin-supplier-approval-requests", normalizedParams],
        queryFn: () => getSupplierApprovalRequests(normalizedParams),
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: autoRefreshIntervalMs,
        refetchIntervalInBackground: false,
    })
}
