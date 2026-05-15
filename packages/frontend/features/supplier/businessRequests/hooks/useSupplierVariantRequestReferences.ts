"use client"

import { useQuery } from "@tanstack/react-query"
import { getSupplierVariantRequestReferences } from "@/features/supplier/businessRequests/api/getSupplierVariantRequestReferences"

export function useSupplierVariantRequestReferences(enabled = true) {
    return useQuery({
        queryKey: ["supplier-variant-request-references"],
        queryFn: getSupplierVariantRequestReferences,
        enabled,
        staleTime: 1000 * 60 * 10,
    })
}
