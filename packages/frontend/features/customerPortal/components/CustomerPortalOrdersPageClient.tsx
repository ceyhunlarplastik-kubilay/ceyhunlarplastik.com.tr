"use client"

import { CustomerPortalOrderRequestsPanel } from "@/features/customerPortal/components/CustomerPortalOrderRequestsPanel"
import { OrdersPageClient } from "@/features/orders/components/OrdersPageClient"

export function CustomerPortalOrdersPageClient() {
    return (
        <div className="space-y-6">
            <CustomerPortalOrderRequestsPanel />

            <OrdersPageClient
                scope="portal"
                title="Siparişlerim"
                description="Onaylanmış siparişlerinizi, vade koşullarını ve toplam tutarları müşteri panelinden takip edin."
            />

        </div>
    )
}
