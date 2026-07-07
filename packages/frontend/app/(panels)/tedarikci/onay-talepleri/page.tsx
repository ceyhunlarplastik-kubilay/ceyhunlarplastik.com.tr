import { BusinessRequestInboxPageClient } from "@/features/businessRequests/components/BusinessRequestInboxPageClient"

export default function SupplierApprovalRequestsPage() {
    return (
        <BusinessRequestInboxPageClient
            scope="supplier"
            title="İş Taleplerim"
            description="Profil, fiyat, kategori, ürün ve varyant taleplerinizi generic workflow üzerinden takip edin."
            defaultDomain="PURCHASING"
            allowedTypes={["SUPPLIER_PROFILE_CHANGE", "SUPPLIER_PRICING_CHANGE", "SUPPLIER_CAPABILITY_CHANGE", "SUPPLIER_CATEGORY_CREATE", "SUPPLIER_PRODUCT_CREATE", "SUPPLIER_VARIANT_CREATE"]}
        />
    )
}
