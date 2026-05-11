"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { replaceCustomerFeaturedProducts } from "@/features/admin/customers/api/replaceCustomerFeaturedProducts"

export function useReplaceCustomerFeaturedProducts(customerId: string) {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (productIds: string[]) => replaceCustomerFeaturedProducts(customerId, productIds),
        onSuccess() {
            qc.invalidateQueries({ queryKey: ["admin-customer-featured-products", customerId] })
            qc.invalidateQueries({ queryKey: ["admin-customer", customerId] })
        },
    })
}
