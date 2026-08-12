"use client"

import Image from "next/image"
import { ImageIcon, Loader2, PackageSearch, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useLeadCustomer } from "@/features/admin/leadCustomers/hooks/useLeadCustomers"
import { LeadCustomerAddressesSection } from "./LeadCustomerAddressesSection"

/**
 * Atamanın SONUCUNU gösterir: bu profille eşleşen ürünler. Müşteri portalındaki
 * "İlgili Ürünler" ile aynı kurallardan beslenir
 * (`buildCustomerProfileProductWhereClauses`), böylece operatör yanlış atamayı
 * portala yansımadan görür.
 */
export function LeadCustomerDetailPanel({
    customerId,
    autoOpenAddress = false,
    onAutoOpenAddressConsumed,
}: {
    customerId: string
    autoOpenAddress?: boolean
    onAutoOpenAddressConsumed?: () => void
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

    const matchSection = (() => {
        if (!hasProfile) {
            return (
                <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-5 text-sm text-amber-800">
                    Bu müşteriye henüz endüstriyel profil atanmamış. Sektör veya kullanım alanı seçilene
                    kadar müşteri portalında &quot;İlgili Ürünler&quot; boş görünür.
                </div>
            )
        }

        if (detail.matchedProductCount === 0) {
            return (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center">
                    <PackageSearch className="mx-auto h-6 w-6 text-neutral-300" />
                    <p className="mt-2 text-sm font-medium text-neutral-700">
                        Bu profille eşleşen ürün bulunamadı
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                        Seçilen kullanım alanlarına atanmış ürün yok. &quot;Kullanım Alanı Ürün Atamaları&quot;
                        sekmesinden bu alanlara ürün atayabilirsiniz.
                    </p>
                </div>
            )
        }

        return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" />
                <span className="text-sm font-medium text-neutral-800">
                    Bu profille eşleşen {detail.matchedProductCount} ürün
                </span>
                {detail.matchedProducts.length < detail.matchedProductCount ? (
                    <Badge variant="outline" className="rounded-full text-[11px] font-normal">
                        ilk {detail.matchedProducts.length} gösteriliyor
                    </Badge>
                ) : null}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {detail.matchedProducts.map((product) => (
                    <div
                        key={product.id}
                        className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-2.5"
                    >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                            {product.primaryImageUrl ? (
                                <Image
                                    src={product.primaryImageUrl}
                                    alt={product.name}
                                    fill
                                    sizes="64px"
                                    className="object-contain p-1.5"
                                />
                            ) : (
                                <div className="grid h-full place-items-center text-neutral-300">
                                    <ImageIcon className="h-5 w-5" />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="font-mono text-[11px] font-semibold text-neutral-950">
                                {product.code}
                            </div>
                            <div className="line-clamp-2 text-xs font-medium leading-4 text-neutral-700">
                                {product.name}
                            </div>
                            {product.matchedLabels.length > 0 ? (
                                <div className="mt-1 line-clamp-1 text-[11px] text-brand">
                                    {product.matchedLabels.join(" · ")}
                                </div>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>
        )
    })()

    return (
        <div className="space-y-5">
            <LeadCustomerAddressesSection
                customerId={customerId}
                addresses={detail.addresses}
                autoOpen={autoOpenAddress}
                onAutoOpenConsumed={onAutoOpenAddressConsumed}
            />

            <div className="h-px bg-neutral-200" />

            {matchSection}
        </div>
    )
}
