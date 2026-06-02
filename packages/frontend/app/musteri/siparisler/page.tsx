import { OrdersPageClient } from "@/features/orders/components/OrdersPageClient"

export default function CustomerPortalOrdersPage() {
    return (
        <OrdersPageClient
            scope="portal"
            title="Siparişlerim"
            description="Onaylanmış siparişlerinizi, vade koşullarını ve toplam tutarları müşteri panelinden takip edin."
        />
    )
}
