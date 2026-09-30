"use client"

import { useQuery } from "@tanstack/react-query"

import {
    getReferenceProductSizes,
    getReferenceProductVariants,
    listReferenceProducts,
    searchReferenceCustomers,
} from "@/features/production/references/api/references"
import { productionQueryKeys } from "@/features/production/shared/queryKeys"

/** Ürün kataloğu seyrek değişir; kalıp formu her açılışta yeniden çekmesin. */
const REFERENCE_STALE_TIME_MS = 5 * 60 * 1000

export function useReferenceProducts(options: { moldable?: boolean } = {}) {
    const moldable = Boolean(options.moldable)
    return useQuery({
        queryKey: moldable ? productionQueryKeys.referenceMoldableProducts() : productionQueryKeys.referenceProducts(),
        queryFn: () => listReferenceProducts({ moldable }),
        staleTime: REFERENCE_STALE_TIME_MS,
    })
}

export function useReferenceProductVariants(productId: string | null) {
    return useQuery({
        queryKey: productionQueryKeys.referenceProductVariants(productId ?? ""),
        queryFn: () => getReferenceProductVariants(productId as string),
        enabled: Boolean(productId),
        staleTime: REFERENCE_STALE_TIME_MS,
    })
}

/** Sunucu araması; önceki sonuç yeni sonuç gelene kadar listede kalır. */
export function useReferenceCustomers(search: string) {
    return useQuery({
        queryKey: productionQueryKeys.referenceCustomers(search),
        queryFn: () => searchReferenceCustomers(search),
        placeholderData: (previous) => previous,
        staleTime: 60 * 1000,
    })
}

export function useReferenceProductSizes(productId: string | null) {
    return useQuery({
        queryKey: productionQueryKeys.referenceProductSizes(productId ?? ""),
        queryFn: () => getReferenceProductSizes(productId as string),
        enabled: Boolean(productId),
        staleTime: REFERENCE_STALE_TIME_MS,
    })
}
