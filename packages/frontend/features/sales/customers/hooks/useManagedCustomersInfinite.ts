"use client"

import { useMemo } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getManagedCustomers } from "@/features/sales/customers/api/getManagedCustomers"

const schema = z.object({
    limit: z.number().int().positive().max(100),
    search: z.string().trim().optional(),
    status: z.enum(["LEAD", "CUSTOMER"]).optional(),
    sectorValueId: z.string().trim().min(1).optional(),
    countryId: z.number().int().positive().optional(),
    stateId: z.number().int().positive().optional(),
    cityId: z.number().int().positive().optional(),
})

type Params = z.input<typeof schema>

/**
 * `useManagedCustomers`'ın (klasik `AdminListPagination` sayfalaması) sonsuz
 * kaydırma sürümü — arama kutusu/combobox gibi kaydırınca sayfa ekleyen
 * yüzeylerde kullanılır. `useManagedCustomers`'ı DEĞİŞTİRMEZ, admin listeleri
 * hâlâ o hook'u kullanır.
 */
export function useManagedCustomersInfinite(params: Params, options: { enabled?: boolean } = {}) {
    const normalized = useMemo(() => schema.parse(params), [params])

    return useInfiniteQuery({
        queryKey: ["sales-managed-customers-infinite", normalized],
        initialPageParam: 1,
        queryFn: ({ pageParam }) => getManagedCustomers({ ...normalized, page: pageParam }),
        getNextPageParam: (lastPage) =>
            lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
        enabled: options.enabled ?? true,
    })
}
