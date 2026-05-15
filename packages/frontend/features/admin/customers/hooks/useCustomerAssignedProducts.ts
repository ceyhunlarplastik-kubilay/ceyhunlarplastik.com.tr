"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerAssignedProducts } from "@/features/admin/customers/api/getCustomerAssignedProducts"

export function useCustomerAssignedProducts(customerId: string, enabled = true) {
    return useQuery({
        queryKey: ["admin-customer-assigned-products", customerId],
        queryFn: () => getCustomerAssignedProducts(customerId),
        enabled: Boolean(customerId) && enabled,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
