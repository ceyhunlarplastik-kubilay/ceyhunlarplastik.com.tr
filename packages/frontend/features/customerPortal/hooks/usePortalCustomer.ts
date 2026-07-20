"use client"

import { useQuery } from "@tanstack/react-query"
import { getPortalCustomer } from "@/features/customerPortal/api/getPortalCustomer"

export function usePortalCustomer() {
    return useQuery({
        queryKey: ["customer-portal-profile"],
        queryFn: getPortalCustomer,
        // Panel ilk-yük dilim 4: ağır (tam ürün ağaçlı) payload'a agresif refetch
        // olmaz — refetchOnMount:"always" + focus refetch kaldırıldı; global
        // default'lar geçerli (staleTime 60sn: stale ise mount'ta çeker).
    })
}
