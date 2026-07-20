"use client"

import { useQuery } from "@tanstack/react-query"
import { getPortalCustomerOverview } from "@/features/customerPortal/api/getPortalCustomerOverview"

/**
 * Overview sayfasının hafif profil sorgusu. `usePortalCustomer`'ın aksine
 * agresif refetch YOK (panel ilk-yük pattern'i): global default'lar geçerli
 * (staleTime 60sn, focus refetch kapalı) — profil verisi sık değişmez.
 */
export function usePortalCustomerOverview() {
    return useQuery({
        queryKey: ["customer-portal-overview"],
        queryFn: getPortalCustomerOverview,
    })
}
