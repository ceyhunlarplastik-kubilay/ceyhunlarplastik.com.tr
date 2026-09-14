"use client"

import { useQuery } from "@tanstack/react-query"
import { getSupplierProducts } from "@/features/supplier/variantPrices/api/getSupplierProducts"

type Params = {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    categoryId?: string
    supplierId?: string
    endpointPrefix?: "supplier" | "purchasing" | "sales"
    autoRefreshIntervalMs?: number | false
    /** Bu uç yalnız `ProductVariantSupplier` satırı olan ürünleri döner; satış
     * panelinin tam katalog ızgarası ARTIK bunu kullanmıyor (`useProducts`e
     * geçti) — o modda gereksiz isteği atlamak için `false` geçilir. */
    enabled?: boolean
}

export function useSupplierProducts(params: Params = {}) {
    const { autoRefreshIntervalMs = false, enabled = true, ...queryParams } = params

    return useQuery({
        queryKey: ["supplier-products", queryParams],
        queryFn: () => getSupplierProducts(queryParams),
        refetchInterval: autoRefreshIntervalMs,
        enabled,
    })
}
