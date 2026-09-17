"use client"

import { Loader2, MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useManagedLeadCustomer } from "@/features/sales/leadCustomers/hooks/useManagedLeadCustomer"
import { CustomerProfileMatchedProducts } from "@/features/crm/components/CustomerProfileMatchedProducts"
import type { LeadCustomerDetail } from "@/features/admin/leadCustomers/api/types"

/**
 * `LeadCustomerDetailPanel`in (veri girişi) satış paneli karşılığı — AYNI
 * `GET .../lead-customers/{id}` şeklini kullanır (`/sales/lead-customers/{id}`,
 * salt-okunur boundary) ama adres CRUD'u YOK: kullanıcı talebiyle adres
 * ekleme/düzenleme veri girişi panelinin sorumluluğunda kalıyor, burada
 * yalnız görüntülenir.
 */
export function SalesLeadCustomerDetailPanel({ customerId }: { customerId: string }) {
    const detailQuery = useManagedLeadCustomer(customerId)
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
        Boolean(detail.sectorValue) || Boolean(detail.productionGroupValue) || detail.usageAreaValues.length > 0

    return (
        <div className="space-y-5">
            <SalesLeadCustomerAddressesReadOnly addresses={detail.addresses} />

            <div className="h-px bg-neutral-200" />

            <CustomerProfileMatchedProducts
                hasProfile={hasProfile}
                matchedProductCount={detail.matchedProductCount}
                matchedProducts={detail.matchedProducts}
                viewAllHref={hasProfile ? buildFilteredProductsHref(detail) : undefined}
            />
        </div>
    )
}

function buildFilteredProductsHref(detail: LeadCustomerDetail) {
    const params = new URLSearchParams()

    if (detail.sectorValue) params.set("sector", detail.sectorValue.slug)
    if (detail.productionGroupValue) params.set("production_group", detail.productionGroupValue.slug)
    if (detail.usageAreaValues.length > 0) {
        params.set("usage_area", detail.usageAreaValues.map((value) => value.slug).join(","))
    }

    return `/musteri-temsilcisi/urunler?${params.toString()}`
}

function SalesLeadCustomerAddressesReadOnly({ addresses }: { addresses: LeadCustomerDetail["addresses"] }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand" />
                <span className="text-sm font-medium text-neutral-800">Adresler</span>
                <Badge variant="outline" className="rounded-full text-[11px] font-normal">
                    {addresses.length}
                </Badge>
            </div>

            {addresses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-5 text-center text-xs text-neutral-500">
                    Henüz adres eklenmemiş.
                </div>
            ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                    {addresses.map((address) => (
                        <div key={address.id} className="rounded-2xl border border-neutral-200 bg-white p-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-sm font-medium text-neutral-950">{address.label}</span>
                                {address.isPrimary ? (
                                    <Badge
                                        variant="outline"
                                        className="rounded-full border-brand/30 bg-brand/5 text-[10px] font-medium text-brand"
                                    >
                                        birincil
                                    </Badge>
                                ) : null}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-4 text-neutral-600">{address.line1}</p>
                            <p className="mt-0.5 text-[11px] text-neutral-400">
                                {[address.district, address.city, address.stateRef?.name, address.country]
                                    .filter(Boolean)
                                    .join(" / ")}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
