"use client"

import { useQuery } from "@tanstack/react-query"
import { getManagedProductAttributesForFilter } from "@/features/customerLocations/api/getManagedProductAttributesForFilter"

// Admin panelindeki useAttributesForFilter'ın ProtectedApi karşılığı — harita
// sayfası admin VE satış panelinde ortak kullanıldığı için sales/sales_director
// oturumu, content_editor/admin'e özel AdminApi ucuna hiç değmemeli.
export function useManagedProductAttributesForFilter() {
    return useQuery({
        queryKey: ["managed-product-attributes-for-filter"],
        queryFn: getManagedProductAttributesForFilter,
        refetchOnWindowFocus: true,
    })
}
