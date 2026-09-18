"use client"

import { Loader2 } from "lucide-react"

import { useManagedCustomer } from "@/features/sales/customers/hooks/useManagedCustomer"
import { useManagedCustomerMatchedProducts } from "@/features/crm/hooks/useManagedCustomerMatchedProducts"
import { CustomerProfileMatchedProducts } from "@/features/crm/components/CustomerProfileMatchedProducts"
import { ReadOnlyAddressList } from "@/features/crm/components/ReadOnlyAddressList"
import type { AdminCustomer } from "@/features/admin/customers/api/types"

/**
 * "Cari Müşteriler" listesindeki "Adresler & Eşleşen Ürünler" accordion'u —
 * `SalesLeadCustomerDetailPanel`in cari müşteri karşılığı, AYNI paylaşılan
 * bileşenleri kullanır (`ReadOnlyAddressList`, `CustomerProfileMatchedProducts`).
 * İkisi de mevcut uçları çağırır (`GET /sales/customers/{id}`,
 * `GET /sales/customers/{id}/matched-products`) — yeni backend gerekmedi.
 */
export function SalesActiveCustomerDetailPanel({ customerId }: { customerId: string }) {
    const detailQuery = useManagedCustomer(customerId)
    const detail = detailQuery.data
    const hasProfile =
        Boolean(detail?.sectorValue) || Boolean(detail?.productionGroupValue) || (detail?.usageAreaValues?.length ?? 0) > 0
    const matchedQuery = useManagedCustomerMatchedProducts(customerId, Boolean(detail))
    const matched = matchedQuery.data

    if (detailQuery.isLoading) {
        return (
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Müşteri detayı yükleniyor
            </div>
        )
    }

    if (!detail) return null

    return (
        <div className="space-y-5">
            <ReadOnlyAddressList addresses={detail.addresses ?? []} />

            <div className="h-px bg-neutral-200" />

            {matchedQuery.isError ? (
                <p className="rounded-2xl border border-dashed border-red-200 bg-red-50/60 px-4 py-4 text-sm text-red-700">
                    Eşleşen ürünler yüklenemedi. Satırı kapatıp yeniden açmayı deneyin.
                </p>
            ) : (
                <CustomerProfileMatchedProducts
                    hasProfile={matched?.hasProfile ?? hasProfile}
                    matchedProductCount={matched?.matchedProductCount ?? 0}
                    matchedProducts={matched?.matchedProducts ?? []}
                    isLoading={matchedQuery.isLoading}
                    viewAllHref={hasProfile ? buildFilteredProductsHref(detail) : undefined}
                />
            )}
        </div>
    )
}

function buildFilteredProductsHref(detail: AdminCustomer) {
    const params = new URLSearchParams()

    if (detail.sectorValue) params.set("sector", detail.sectorValue.slug)
    if (detail.productionGroupValue) params.set("production_group", detail.productionGroupValue.slug)
    if (detail.usageAreaValues && detail.usageAreaValues.length > 0) {
        params.set("usage_area", detail.usageAreaValues.map((value) => value.slug).join(","))
    }

    return `/musteri-temsilcisi/urunler?${params.toString()}`
}
