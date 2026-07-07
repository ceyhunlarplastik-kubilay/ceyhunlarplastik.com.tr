import { BusinessRequestInboxPageClient } from "@/features/businessRequests/components/BusinessRequestInboxPageClient"

export default function AdminSupplierApprovalRequestsPage() {
    return (
        <BusinessRequestInboxPageClient
            scope="admin"
            title="Tedarikçi İş Talepleri"
            description="Supplier kaynaklı profil, fiyat, kategori, ürün ve varyant taleplerini generic workflow üzerinden inceleyin."
            defaultDomain="PURCHASING"
            allowedTypes={["SUPPLIER_PROFILE_CHANGE", "SUPPLIER_PRICING_CHANGE", "SUPPLIER_CAPABILITY_CHANGE", "SUPPLIER_CATEGORY_CREATE", "SUPPLIER_PRODUCT_CREATE", "SUPPLIER_VARIANT_CREATE"]}
        />
    )
}
