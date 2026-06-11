"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "motion/react"
import { BadgePercent, CalendarClock, FileText, Plus, ReceiptText, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CustomerVariantSpecialPrice } from "@/features/admin/customers/api/types"
import {
    mapSpecialPriceToPortalDraftPreview,
    resolvePortalDraftPricing,
} from "@/features/customerPortal/pricing/portalDraftPricing"
import { usePortalRequestDraftStore } from "@/features/customerPortal/stores/usePortalRequestDraftStore"
import {
    buildPortalSpecialPriceVariantKey,
    formatPortalPaymentSchedule,
    formatPortalSpecialPriceDate,
    formatPortalSpecialPriceMeasurements,
    getPortalSpecialPriceProductImageUrl,
} from "@/features/customerPortal/specialPrices/utils/customerPortalSpecialPriceFormatters"
import { formatMoney } from "@/lib/customers/pricing"

type Props = {
    item: CustomerVariantSpecialPrice
    index: number
}

export function CustomerPortalSpecialPriceCard({ item, index }: Props) {
    const addItem = usePortalRequestDraftStore((state) => state.addItem)
    const product = item.productVariant?.product
    const variant = item.productVariant
    const quantity = item.minOrderQuantity ?? 1
    const specialPricePreview = mapSpecialPriceToPortalDraftPreview(item)
    const resolvedPricing = resolvePortalDraftPricing({
        quantity,
        listUnitPrice: item.pricing.listPrice,
        currency: item.pricing.currency,
        generalDiscountPercent: item.customer?.generalDiscountPercent ?? null,
        specialPrice: specialPricePreview,
    })

    function handleAddToDraft() {
        if (!product || !variant) return

        addItem({
            productId: product.id,
            productSlug: product.slug,
            productName: product.name,
            productCode: product.code,
            productImageUrl: getPortalSpecialPriceProductImageUrl(item),
            variantId: variant.id,
            variantName: variant.name,
            variantKey: buildPortalSpecialPriceVariantKey(item),
            variantFullCode: variant.fullCode,
            quantity,
            listUnitPrice: resolvedPricing.listUnitPrice,
            customerUnitPrice: resolvedPricing.customerUnitPrice,
            appliedDiscountPercent: resolvedPricing.appliedDiscountPercent,
            generalDiscountPercent: item.customer?.generalDiscountPercent ?? null,
            priceSource: resolvedPricing.priceSource,
            specialPriceId: resolvedPricing.specialPriceId,
            specialPricePreview,
            specialPriceEligible: resolvedPricing.specialPriceEligible,
            specialPriceIneligibilityReason: resolvedPricing.specialPriceIneligibilityReason,
            specialPriceIneligibilityMessage: resolvedPricing.specialPriceIneligibilityMessage,
            pricingSnapshot: resolvedPricing.pricingSnapshot,
            currency: resolvedPricing.currency,
            targetUnitPrice: null,
            customerNote: "",
        })
        toast.success(`Özel fiyatlı ürün sepete ${quantity} adet olarak eklendi.`)
    }

    return (
        <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.05 }}
            className="grid gap-5 overflow-hidden rounded-[28px] border border-amber-100 bg-white p-4 shadow-sm lg:grid-cols-[180px_minmax(0,1fr)]"
        >
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50">
                <Image
                    src={getPortalSpecialPriceProductImageUrl(item)}
                    alt={product?.name ?? "Ürün"}
                    fill
                    sizes="(max-width: 1024px) 100vw, 180px"
                    className="object-contain p-3"
                />
            </div>

            <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-100">
                        <BadgePercent className="mr-1.5 h-3.5 w-3.5" />
                        Özel Fiyat
                    </Badge>
                    <Badge variant="outline">{item.taxIncluded ? "KDV dahil" : "KDV hariç"}</Badge>
                    {item.minOrderQuantity ? <Badge variant="secondary">Minimum {item.minOrderQuantity} adet</Badge> : null}
                </div>

                <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight text-neutral-950">{product?.name ?? "Ürün"}</h2>
                    <p className="text-sm text-neutral-500">
                        {product?.code ?? "-"} - {variant?.fullCode ?? "-"}
                    </p>
                    <p className="text-sm leading-6 text-neutral-600">
                        {variant?.color?.name ? `${variant.color.name} - ` : ""}{formatPortalSpecialPriceMeasurements(item)}
                    </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">Liste Fiyatı</div>
                        <div className="mt-1 text-sm font-medium text-neutral-600 line-through">
                            {formatMoney(item.pricing.listPrice, item.pricing.currency)}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-amber-700">Firmanıza Özel</div>
                        <div className="mt-1 text-lg font-semibold text-amber-950">
                            {formatMoney(resolvedPricing.customerUnitPrice, resolvedPricing.currency)}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">Vade</div>
                        <div className="mt-1 text-sm font-medium text-neutral-900">
                            {formatPortalPaymentSchedule(item)}
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
                        <ReceiptText className="h-4 w-4 text-neutral-400" />
                        Min: {item.minOrderQuantity ?? "-"} / Max: {item.maxOrderQuantity ?? "-"}
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
                        <CalendarClock className="h-4 w-4 text-neutral-400" />
                        {formatPortalSpecialPriceDate(item.validUntil)} tarihine kadar
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
                        <FileText className="h-4 w-4 text-neutral-400" />
                        {item.contractReference || "Referans yok"}
                    </div>
                </div>

                {item.note ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                        {item.note}
                    </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                    {product?.slug ? (
                        <Button asChild variant="outline">
                            <Link href={`/musteri/tum-urunler/urun/${product.slug}`}>Ürünü İncele</Link>
                        </Button>
                    ) : null}
                    <Button type="button" onClick={handleAddToDraft}>
                        <Plus className="mr-2 h-4 w-4" />
                        Sepete Ekle
                    </Button>
                    <Button asChild variant="secondary">
                        <Link href="/musteri/talepler/siparis-talebi">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Talep Oluştur
                        </Link>
                    </Button>
                </div>
            </div>
        </motion.article>
    )
}
