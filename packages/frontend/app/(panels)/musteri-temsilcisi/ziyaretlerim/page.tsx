import { CalendarClock } from "lucide-react"
import { SalesVisitsPageClient } from "@/features/sales/visits/components/SalesVisitsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function SalesVisitsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<CalendarClock className="size-20" strokeWidth={1.5} />}
                    title="Ziyaretler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <SalesVisitsPageClient />
        </PageLoadingGate>
    )
}
