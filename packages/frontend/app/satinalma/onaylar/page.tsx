import { BusinessRequestInboxPageClient } from "@/features/businessRequests/components/BusinessRequestInboxPageClient"

export default function PurchasingApprovalRequestsPage() {
    return (
        <BusinessRequestInboxPageClient
            scope="purchasing"
            title="Satın Alma Onay Talepleri"
            description="Tedarikçi odaklı değişiklik ve yetkinlik taleplerini buradan takip edin."
            defaultDomain="PURCHASING"
        />
    )
}
