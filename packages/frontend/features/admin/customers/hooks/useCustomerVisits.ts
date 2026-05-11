"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerVisits } from "@/features/admin/customers/api/getCustomerVisits"

export function useCustomerVisits(customerId: string) {
    return useQuery({
        queryKey: ["admin-customer-visits", customerId],
        queryFn: () => getCustomerVisits(customerId),
        enabled: Boolean(customerId),
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
