"use client"

import { useQuery } from "@tanstack/react-query"

import {
    getProductMatchedCustomers,
    type GetProductMatchedCustomersParams,
} from "@/features/productMatchedCustomers/api/getProductMatchedCustomers"

export function useProductMatchedCustomers(
    params: GetProductMatchedCustomersParams,
    options?: { enabled?: boolean },
) {
    return useQuery({
        queryKey: ["product-matched-customers", params],
        queryFn: () => getProductMatchedCustomers(params),
        enabled: options?.enabled ?? Boolean(params.productId),
        // Arama/sayfa değişiminde içerik boşalmasın — bölüm-yerel katman
        // eski listenin üstüne biner (AGENTS.md refetch-feedback deseni).
        placeholderData: (previous) => previous,
    })
}
