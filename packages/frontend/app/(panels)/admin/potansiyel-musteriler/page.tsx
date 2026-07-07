import { CustomersPageClient } from "@/features/admin/customers/components/CustomersPageClient"

export default function AdminLeadCustomersPage() {
    return (
        <CustomersPageClient
            title="Potansiyel Müşteriler"
            description="Henüz satışa dönüşmemiş lead kayıtlarını, satış temsilcisi atamalarını ve CRM filtrelerini buradan yönetin."
            lockedStatus="LEAD"
            statusLabel="potansiyel müşteri"
            hideStatusFilter
        />
    )
}
