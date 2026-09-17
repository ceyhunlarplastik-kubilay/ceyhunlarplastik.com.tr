import { ShieldCheck } from "lucide-react"
import { BusinessRequestInboxPageClient } from "@/features/businessRequests/components/BusinessRequestInboxPageClient"
import { PageLoadingGate } from "@/components/feedback/PageLoadingGate"
import { PageLoadingOverlay } from "@/components/feedback/PageLoadingOverlay"

export default function AdminSupplierApprovalRequestsPage() {
    return (
        <PageLoadingGate
            overlay={(
                <PageLoadingOverlay
                    icon={<ShieldCheck className="size-20" strokeWidth={1.5} />}
                    title="Tedarikçi iş talepleri yükleniyor"
                    description="Lütfen kısa bir an bekleyin."
                />
            )}
        >
            <BusinessRequestInboxPageClient
                scope="admin"
                title="Tedarikçi İş Talepleri"
                description="Supplier kaynaklı profil, fiyat, kategori, ürün ve varyant taleplerini generic workflow üzerinden inceleyin."
                defaultDomain="PURCHASING"
                allowedTypes={["SUPPLIER_PROFILE_CHANGE", "SUPPLIER_PRICING_CHANGE", "SUPPLIER_CAPABILITY_CHANGE", "SUPPLIER_CATEGORY_CREATE", "SUPPLIER_PRODUCT_CREATE", "SUPPLIER_VARIANT_CREATE"]}
            />
        </PageLoadingGate>
    )
}
