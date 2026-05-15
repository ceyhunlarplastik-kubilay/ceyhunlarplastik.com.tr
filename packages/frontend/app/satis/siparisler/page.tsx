import { BusinessRequestOrdersPageClient } from "@/features/businessRequests/components/BusinessRequestOrdersPageClient"

export default function SalesOrdersPage() {
    return (
        <BusinessRequestOrdersPageClient
            scope="sales"
            title="Siparişler"
            description="Atanmış müşterilerinizden gelen sipariş taleplerini ve pazarlık notlarını tek ekranda takip edin."
        />
    )
}
