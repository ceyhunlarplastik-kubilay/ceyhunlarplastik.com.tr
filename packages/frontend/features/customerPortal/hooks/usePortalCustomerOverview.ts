"use client"

import { useQuery } from "@tanstack/react-query"
import {
    getPortalCustomerOverview,
    type PortalCustomerOverview,
} from "@/features/customerPortal/api/getPortalCustomerOverview"

/**
 * Overview sayfasının hafif profil sorgusu. `usePortalCustomer`'ın aksine
 * agresif refetch YOK (panel ilk-yük pattern'i): global default'lar geçerli
 * (staleTime 60sn, focus refetch kapalı) — profil verisi sık değişmez.
 *
 * `initialData` (dilim 3): RSC'de çekilen veri buradan verilirse ilk boya
 * spinner'sız gelir ve staleTime içinde client refetch tetiklenmez.
 */
export function usePortalCustomerOverview(
    options: { initialData?: PortalCustomerOverview } = {},
) {
    return useQuery({
        queryKey: ["customer-portal-overview"],
        queryFn: getPortalCustomerOverview,
        initialData: options.initialData,
    })
}
