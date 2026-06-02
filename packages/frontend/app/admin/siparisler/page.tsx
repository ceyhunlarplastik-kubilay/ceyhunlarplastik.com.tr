import { OrdersPageClient } from "@/features/orders/components/OrdersPageClient"

export default function AdminOrdersPage() {
    return (
        <OrdersPageClient
            scope="admin"
            title="Siparişler"
            description="Onaylanmış siparişleri müşteri, durum ve ticari özetleriyle birlikte operasyonel olarak takip edin."
        />
    )
}
