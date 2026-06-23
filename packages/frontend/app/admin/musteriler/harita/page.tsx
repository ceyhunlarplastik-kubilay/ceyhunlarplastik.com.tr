import { CustomerMapPageClient } from "@/features/customerLocations/components/CustomerMapPageClient"

export default function AdminCustomerMapPage() {
    return (
        <CustomerMapPageClient
            title="Müşteri Haritası"
            description="Cari ve potansiyel müşterileri tek harita ekranında görüntüleyin, temsilci filtresi uygulayın ve operasyonel erişimi hızlandırın."
            customerDetailBasePath="/admin/customers"
            allowSalesFilter
        />
    )
}
