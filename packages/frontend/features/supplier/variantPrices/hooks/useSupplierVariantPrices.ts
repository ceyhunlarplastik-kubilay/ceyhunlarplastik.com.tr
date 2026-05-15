"use client"

import { useQuery } from "@tanstack/react-query"
import { getSupplierVariantPrices } from "@/features/supplier/variantPrices/api/getSupplierVariantPrices"
import type { GetSupplierVariantPricesParams } from "@/features/supplier/variantPrices/api/types"

type Options = {
    enabled?: boolean
    refetchInterval?: number | false
}

export function useSupplierVariantPrices(params: GetSupplierVariantPricesParams, options: Options = {}) {
    const endpointPrefix = params.endpointPrefix ?? "supplier"
    const { enabled = true, refetchInterval = false } = options

    return useQuery({
        queryKey: ["supplier-variant-prices", endpointPrefix, params],
        queryFn: () => getSupplierVariantPrices(params),
        enabled,
        refetchInterval,
    })
}
