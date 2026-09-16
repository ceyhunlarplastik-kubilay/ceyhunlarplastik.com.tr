"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { getManagedLeadCustomers } from "@/features/sales/leadCustomers/api/getManagedLeadCustomers"
import type { ListLeadCustomersParams } from "@/features/admin/leadCustomers/api/types"

type Params = Omit<ListLeadCustomersParams, "page">

/**
 * `useManagedLeadCustomers`'ın sonsuz kaydırma sürümü — bkz.
 * `useManagedCustomersInfinite` üstteki not.
 */
export function useManagedLeadCustomersInfinite(params: Params, options: { enabled?: boolean } = {}) {
    return useInfiniteQuery({
        queryKey: ["sales-managed-lead-customers-infinite", params],
        initialPageParam: 1,
        queryFn: ({ pageParam }) => getManagedLeadCustomers({ ...params, page: pageParam }),
        getNextPageParam: (lastPage) =>
            lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
        enabled: options.enabled ?? true,
    })
}
