import { Users } from "lucide-react"
import { CustomersPageClient } from "@/features/admin/customers/components/CustomersPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function AdminAccountCustomersPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<Users className="size-20" strokeWidth={1.5} />}
                    title="Cari müşteriler yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomersPageClient
                title="Cari Müşteriler"
                description="Satış yapılan ve aktif olarak takip edilen müşteri kayıtlarını, temsilci atamalarını ve sektör odaklı filtreleri buradan yönetin."
                lockedStatus="CUSTOMER"
                statusLabel="cari müşteri"
                hideStatusFilter
            />
        </PageLoadingGate>
    )
}
