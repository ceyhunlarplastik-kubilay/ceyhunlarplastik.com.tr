import { MapPinned } from "lucide-react"
import { CustomerMapPageClient } from "@/features/customerLocations/components/CustomerMapPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function AdminCustomerMapPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<MapPinned className="size-20" strokeWidth={1.5} />}
                    title="Harita yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <CustomerMapPageClient
                title="Müşteri Haritası"
                description="Cari ve potansiyel müşterileri tek harita ekranında görüntüleyin, temsilci filtresi uygulayın ve operasyonel erişimi hızlandırın."
                customerDetailBasePath="/admin/customers"
                allowSalesFilter
            />
        </PageLoadingGate>
    )
}
