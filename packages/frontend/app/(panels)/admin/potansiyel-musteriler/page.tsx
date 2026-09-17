import { Users } from "lucide-react"
import { CustomersPageClient } from "@/features/admin/customers/components/CustomersPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function AdminLeadCustomersPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Users className="size-20" strokeWidth={1.5} />}
                    title="Potansiyel müşteriler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomersPageClient
                title="Potansiyel Müşteriler"
                description="Henüz satışa dönüşmemiş lead kayıtlarını, müşteri temsilcisi atamalarını ve CRM filtrelerini buradan yönetin."
                lockedStatus="LEAD"
                statusLabel="potansiyel müşteri"
                hideStatusFilter
            />
        </PageLoadingGate>
    )
}
