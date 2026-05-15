"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { replaceCustomerAssignedProducts } from "@/features/admin/customers/api/replaceCustomerAssignedProducts"

export function useReplaceCustomerAssignedProducts(customerId: string) {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (productIds: string[]) => replaceCustomerAssignedProducts(customerId, productIds),
        onSuccess() {
            qc.invalidateQueries({ queryKey: ["admin-customer-assigned-products", customerId] })
            qc.invalidateQueries({ queryKey: ["admin-customer", customerId] })
        },
    })
}
