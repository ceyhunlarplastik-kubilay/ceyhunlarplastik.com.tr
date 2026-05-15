import { BusinessRequestInboxPageClient } from "@/features/businessRequests/components/BusinessRequestInboxPageClient"

export default function SalesApprovalRequestsPage() {
    return (
        <BusinessRequestInboxPageClient
            scope="sales"
            title="Satış Onay Talepleri"
            description="Müşteri portalından ve satış ekibinden gelen talepleri inceleyin. Sales director bu ekranda satış adımlarını override edebilir."
            defaultDomain="SALES"
        />
    )
}
