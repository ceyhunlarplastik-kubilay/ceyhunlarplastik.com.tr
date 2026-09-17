import { ClipboardList } from "lucide-react"
import { OrdersPageClient } from "@/features/orders/components/OrdersPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function AdminOrdersPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<ClipboardList className="size-20" strokeWidth={1.5} />}
                    title="Siparişler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <OrdersPageClient
                scope="admin"
                title="Siparişler"
                description="Onaylanmış siparişleri müşteri, durum ve ticari özetleriyle birlikte operasyonel olarak takip edin."
            />
        </PageLoadingGate>
    )
}
