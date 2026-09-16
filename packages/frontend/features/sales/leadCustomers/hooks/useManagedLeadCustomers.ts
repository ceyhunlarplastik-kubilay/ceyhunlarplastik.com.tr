"use client"

import { useQuery } from "@tanstack/react-query"
import { getManagedLeadCustomers } from "@/features/sales/leadCustomers/api/getManagedLeadCustomers"
import type { ListLeadCustomersParams } from "@/features/admin/leadCustomers/api/types"

export const managedLeadCustomerKeys = {
    all: ["sales-managed-lead-customers"] as const,
    list: (params: ListLeadCustomersParams) => [...managedLeadCustomerKeys.all, "list", params] as const,
}

export function useManagedLeadCustomers(
    params: ListLeadCustomersParams,
    options: { autoRefreshIntervalMs?: number | false } = {},
) {
    return useQuery({
        queryKey: managedLeadCustomerKeys.list(params),
        queryFn: () => getManagedLeadCustomers(params),
        placeholderData: (prev) => prev,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchInterval: options.autoRefreshIntervalMs ?? false,
        refetchIntervalInBackground: false,
    })
}
