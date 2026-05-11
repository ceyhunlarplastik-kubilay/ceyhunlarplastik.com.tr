"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerFeaturedProducts } from "@/features/admin/customers/api/getCustomerFeaturedProducts"

export function useCustomerFeaturedProducts(customerId: string) {
    return useQuery({
        queryKey: ["admin-customer-featured-products", customerId],
        queryFn: () => getCustomerFeaturedProducts(customerId),
        enabled: Boolean(customerId),
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
