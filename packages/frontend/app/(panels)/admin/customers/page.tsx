import { Building2 } from "lucide-react"
import { CustomersPageClient } from "@/features/admin/customers/components/CustomersPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function AdminCustomersPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Building2 className="size-20" strokeWidth={1.5} />}
                    title="Müşteriler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomersPageClient />
        </PageLoadingGate>
    )
}
