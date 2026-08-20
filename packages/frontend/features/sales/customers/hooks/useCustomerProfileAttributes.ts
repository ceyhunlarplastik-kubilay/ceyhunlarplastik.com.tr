"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomerProfileAttributes } from "@/features/sales/customers/api/getCustomerProfileAttributes"

export function useCustomerProfileAttributes() {
    return useQuery({
        queryKey: ["sales-customer-profile-attributes"],
        queryFn: getCustomerProfileAttributes,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    })
}
