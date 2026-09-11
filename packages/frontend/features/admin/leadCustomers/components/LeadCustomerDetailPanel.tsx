"use client"

import { Loader2 } from "lucide-react"

import { useLeadCustomer } from "@/features/admin/leadCustomers/hooks/useLeadCustomers"
import { CustomerProfileMatchedProducts } from "@/features/crm/components/CustomerProfileMatchedProducts"
import { LeadCustomerAddressesSection } from "./LeadCustomerAddressesSection"

/**
 * Atamanın SONUCUNU gösterir: bu profille eşleşen ürünler. Eşleşen ürün listesi
 * artık paylaşılan `CustomerProfileMatchedProducts` bileşeninden gelir (satış
 * paneli müşteri haritası da aynısını kullanır).
 */
export function LeadCustomerDetailPanel({
    customerId,
}: {
    customerId: string
}) {
    const detailQuery = useLeadCustomer(customerId)
    const detail = detailQuery.data

    if (detailQuery.isLoading) {
        return (
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Müşteri detayı yükleniyor
            </div>
        )
    }

    if (!detail) return null

    const hasProfile =
        Boolean(detail.sectorValue) ||
        Boolean(detail.productionGroupValue) ||
        detail.usageAreaValues.length > 0

    return (
        <div className="space-y-5">
            <LeadCustomerAddressesSection
                customerId={customerId}
                addresses={detail.addresses}
            />

            <div className="h-px bg-neutral-200" />

            <CustomerProfileMatchedProducts
                hasProfile={hasProfile}
                matchedProductCount={detail.matchedProductCount}
                matchedProducts={detail.matchedProducts}
            />
        </div>
    )
}
