import { CustomersPageClient } from "@/features/admin/customers/components/CustomersPageClient"

export default function AdminAccountCustomersPage() {
    return (
        <CustomersPageClient
            title="Cari Müşteriler"
            description="Satış yapılan ve aktif olarak takip edilen müşteri kayıtlarını, temsilci atamalarını ve sektör odaklı filtreleri buradan yönetin."
            lockedStatus="CUSTOMER"
            statusLabel="cari müşteri"
            hideStatusFilter
        />
    )
}
