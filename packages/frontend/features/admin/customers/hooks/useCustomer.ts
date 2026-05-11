"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomer } from "@/features/admin/customers/api/getCustomer"

export function useCustomer(id: string) {
    return useQuery({
        queryKey: ["admin-customer", id],
        queryFn: () => getCustomer(id),
        enabled: Boolean(id),
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
