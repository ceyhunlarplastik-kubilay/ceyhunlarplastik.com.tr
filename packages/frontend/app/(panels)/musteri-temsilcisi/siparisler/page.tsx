import { ClipboardList } from "lucide-react"
import { OrdersPageClient } from "@/features/orders/components/OrdersPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function SalesOrdersPage() {
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
                scope="sales"
                title="Siparişler"
                description="Atanmış müşterileriniz için onaylanmış siparişleri, terminleri ve toplamları tek ekranda takip edin."
            />
        </PageLoadingGate>
    )
}
