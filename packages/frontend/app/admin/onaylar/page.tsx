import { BusinessRequestInboxPageClient } from "@/features/businessRequests/components/BusinessRequestInboxPageClient"

export default function AdminBusinessRequestsPage() {
    return (
        <BusinessRequestInboxPageClient
            scope="admin"
            title="İş Talep Onayları"
            description="Satış ve satın alma domainlerindeki tüm generic workflow taleplerini tek ekranda yönetin."
            showDomainFilter
        />
    )
}
