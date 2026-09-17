import { Building2 } from "lucide-react"
import { CompanyContactsPageClient } from "@/features/admin/companyContacts/components/CompanyContactsPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function AdminCompanyContactsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Building2 className="size-20" strokeWidth={1.5} />}
                    title="Departman iletişimleri yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CompanyContactsPageClient />
        </PageLoadingGate>
    )
}
