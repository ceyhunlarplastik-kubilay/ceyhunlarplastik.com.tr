"use client"

import { useQuery } from "@tanstack/react-query"
import { getPortalSpecialPrices } from "@/features/customerPortal/api/getPortalSpecialPrices"

export function usePortalSpecialPrices() {
    return useQuery({
        queryKey: ["customer-portal-special-prices"],
        queryFn: getPortalSpecialPrices,
        refetchOnMount: "always",
    })
}
