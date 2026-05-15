"use client"

import { useQuery } from "@tanstack/react-query"
import { getManagedCustomer } from "@/features/sales/customers/api/getManagedCustomer"

export function useManagedCustomer(id: string, enabled = true) {
    return useQuery({
        queryKey: ["sales-managed-customer", id],
        queryFn: () => getManagedCustomer(id),
        enabled: Boolean(id) && enabled,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
