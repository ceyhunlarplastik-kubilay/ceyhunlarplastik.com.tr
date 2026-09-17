import { CalendarClock } from "lucide-react"
import { AdminCustomerVisitsReportPageClient } from "@/features/sales/visits/components/CustomerVisitsReportPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function AdminCustomerVisitsReportPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<CalendarClock className="size-20" strokeWidth={1.5} />}
                    title="Müşteri ziyaretleri yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <AdminCustomerVisitsReportPageClient />
        </PageLoadingGate>
    )
}
