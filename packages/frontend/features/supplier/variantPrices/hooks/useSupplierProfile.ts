"use client"

import { useQuery } from "@tanstack/react-query"
import { getSupplierProfile } from "@/features/supplier/variantPrices/api/getSupplierProfile"

export function useSupplierProfile(
    endpointPrefix: "supplier" | "purchasing" | "sales" = "supplier",
    enabled = true
) {
    return useQuery({
        queryKey: ["supplier-profile", endpointPrefix],
        queryFn: () => getSupplierProfile(endpointPrefix),
        enabled,
        staleTime: 1000 * 60 * 5,
    })
}
