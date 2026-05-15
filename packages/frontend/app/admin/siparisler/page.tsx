import { BusinessRequestOrdersPageClient } from "@/features/businessRequests/components/BusinessRequestOrdersPageClient"

export default function AdminOrdersPage() {
    return (
        <BusinessRequestOrdersPageClient
            scope="admin"
            title="Siparişler"
            description="Müşteri portalından açılan sipariş taleplerini firma, durum ve tarihe göre inceleyin."
        />
    )
}
