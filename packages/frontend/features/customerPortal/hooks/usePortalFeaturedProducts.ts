"use client"

import { useQuery } from "@tanstack/react-query"
import { getPortalFeaturedProducts } from "@/features/customerPortal/api/getPortalFeaturedProducts"

export function usePortalFeaturedProducts() {
    return useQuery({
        queryKey: ["customer-portal-featured-products"],
        queryFn: getPortalFeaturedProducts,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
