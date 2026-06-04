"use client"

import { useQuery } from "@tanstack/react-query"
import { getManagedCompanyContacts } from "@/features/sales/customers/api/getManagedCompanyContacts"

export function useManagedCompanyContacts() {
    return useQuery({
        queryKey: ["sales-managed-company-contacts"],
        queryFn: getManagedCompanyContacts,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
    })
}
