"use client"

import { useQuery } from "@tanstack/react-query"
import { getPortalAssignedProducts } from "@/features/customerPortal/api/getPortalAssignedProducts"

export function usePortalAssignedProducts() {
    return useQuery({
        queryKey: ["customer-portal-assigned-products"],
        queryFn: getPortalAssignedProducts,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
