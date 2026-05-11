"use client"

import { useQuery } from "@tanstack/react-query"
import { getPortalCustomer } from "@/features/customerPortal/api/getPortalCustomer"

export function usePortalCustomer() {
    return useQuery({
        queryKey: ["customer-portal-profile"],
        queryFn: getPortalCustomer,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
