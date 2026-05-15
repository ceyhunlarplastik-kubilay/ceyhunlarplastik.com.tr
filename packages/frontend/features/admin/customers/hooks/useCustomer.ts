"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomer } from "@/features/admin/customers/api/getCustomer"

export function useCustomer(id: string, enabled = true) {
    return useQuery({
        queryKey: ["admin-customer", id],
        queryFn: () => getCustomer(id),
        enabled: Boolean(id) && enabled,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
