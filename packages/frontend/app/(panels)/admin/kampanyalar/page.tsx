import { CampaignsPageClient } from "@/features/sales/campaigns/components/CampaignsPageClient"

/**
 * Aynı ekran iki çalışma alanında: satış müdürü `/musteri-temsilcisi` altından, admin/owner
 * kendi panelinden ulaşır. Uç tek: ProtectedApi `/sales/product-variant-campaigns`.
 */
export default function AdminCampaignsPage() {
    return <CampaignsPageClient />
}
