"use client"

import { useQuery } from "@tanstack/react-query"
import { getManagedLeadCustomer } from "@/features/sales/leadCustomers/api/getManagedLeadCustomer"

export const managedLeadCustomerDetailKeys = {
    all: ["sales-managed-lead-customer-detail"] as const,
    detail: (id: string) => [...managedLeadCustomerDetailKeys.all, id] as const,
}

export function useManagedLeadCustomer(id: string) {
    return useQuery({
        queryKey: managedLeadCustomerDetailKeys.detail(id),
        queryFn: () => getManagedLeadCustomer(id),
        enabled: Boolean(id),
        refetchOnWindowFocus: false,
    })
}
