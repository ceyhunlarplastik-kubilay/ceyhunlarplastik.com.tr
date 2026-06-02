import { OrdersPageClient } from "@/features/orders/components/OrdersPageClient"

export default function SalesOrdersPage() {
    return (
        <OrdersPageClient
            scope="sales"
            title="Siparişler"
            description="Atanmış müşterileriniz için onaylanmış siparişleri, terminleri ve toplamları tek ekranda takip edin."
        />
    )
}
