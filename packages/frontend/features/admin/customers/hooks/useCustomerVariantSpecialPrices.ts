"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    createCustomerVariantSpecialPrice,
    deactivateCustomerVariantSpecialPrice,
    getCustomerVariantSpecialPrices,
    updateCustomerVariantSpecialPrice,
    type CustomerVariantSpecialPriceInput,
} from "@/features/admin/customers/api/customerVariantSpecialPrices"

export function customerVariantSpecialPricesQueryKey(customerId: string) {
    return ["customer-variant-special-prices", customerId] as const
}

export function useCustomerVariantSpecialPrices(customerId: string, enabled = true) {
    return useQuery({
        queryKey: customerVariantSpecialPricesQueryKey(customerId),
        queryFn: () => getCustomerVariantSpecialPrices(customerId),
        enabled: Boolean(customerId) && enabled,
        refetchOnMount: "always",
    })
}

export function useCreateCustomerVariantSpecialPrice(customerId: string) {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (data: CustomerVariantSpecialPriceInput & { productVariantId: string; price: number }) =>
            createCustomerVariantSpecialPrice({ customerId, data }),
        onSuccess() {
            qc.invalidateQueries({ queryKey: customerVariantSpecialPricesQueryKey(customerId) })
        },
    })
}

export function useUpdateCustomerVariantSpecialPrice(customerId: string) {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (input: { specialPriceId: string; data: CustomerVariantSpecialPriceInput }) =>
            updateCustomerVariantSpecialPrice({ customerId, ...input }),
        onSuccess() {
            qc.invalidateQueries({ queryKey: customerVariantSpecialPricesQueryKey(customerId) })
        },
    })
}

export function useDeactivateCustomerVariantSpecialPrice(customerId: string) {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: (specialPriceId: string) => deactivateCustomerVariantSpecialPrice({ customerId, specialPriceId }),
        onSuccess() {
            qc.invalidateQueries({ queryKey: customerVariantSpecialPricesQueryKey(customerId) })
        },
    })
}
