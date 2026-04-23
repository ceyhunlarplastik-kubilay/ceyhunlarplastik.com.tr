"use client"

import { useQuery } from "@tanstack/react-query"
import { getSupplierVariantPrices } from "@/features/supplier/variantPrices/api/getSupplierVariantPrices"
import type { GetSupplierVariantPricesParams } from "@/features/supplier/variantPrices/api/types"

export function useSupplierVariantPrices(params: GetSupplierVariantPricesParams) {
    return useQuery({
        queryKey: ["supplier-variant-prices", params],
        queryFn: () => getSupplierVariantPrices(params),
    })
}
