import { BusinessRequestInboxPageClient } from "@/features/businessRequests/components/BusinessRequestInboxPageClient"

export default function SalesApprovalRequestsPage() {
    return (
        <BusinessRequestInboxPageClient
            scope="sales"
            title="Müşteri Temsilcisi Onay Talepleri"
            description="Müşteri portalından ve satış ekibinden gelen talepleri inceleyin. Satış direktörü bu ekranda satış adımlarını override edebilir."
            defaultDomain="SALES"
        />
    )
}
