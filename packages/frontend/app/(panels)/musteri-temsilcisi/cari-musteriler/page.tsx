import { Building2 } from "lucide-react"
import { SalesActiveCustomersPageClient } from "@/features/sales/customers/components/SalesActiveCustomersPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function SalesActiveCustomersPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Building2 className="size-20" strokeWidth={1.5} />}
                    title="Cari müşteriler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <SalesActiveCustomersPageClient />
        </PageLoadingGate>
    )
}
