"use client"

import { useQuery } from "@tanstack/react-query"
import { getManagedCustomerMatchedProducts } from "@/features/crm/api/getManagedCustomerMatchedProducts"

/**
 * Tembel: yalnız `enabled` (ör. accordion satırı açık) iken çeker. Müşteri
 * bazında cache — aynı satır tekrar açıldığında yeniden istek atılmaz.
 */
export function useManagedCustomerMatchedProducts(customerId: string, enabled: boolean) {
    return useQuery({
        queryKey: ["managed-customer-matched-products", customerId],
        queryFn: () => getManagedCustomerMatchedProducts(customerId),
        enabled: enabled && Boolean(customerId),
        staleTime: 5 * 60 * 1000,
    })
}
