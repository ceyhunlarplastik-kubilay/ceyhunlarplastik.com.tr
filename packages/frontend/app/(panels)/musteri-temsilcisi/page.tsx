import { Users } from "lucide-react"
import { SalesCustomersPageClient } from "@/features/sales/customers/components/SalesCustomersPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function SalesPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Users className="size-20" strokeWidth={1.5} />}
                    title="Müşteriler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <SalesCustomersPageClient />
        </PageLoadingGate>
    )
}
