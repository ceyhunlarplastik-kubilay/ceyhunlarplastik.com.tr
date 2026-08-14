"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarClock, Sparkles, Tag } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDiscountPercent } from "@/features/sales/campaigns/lib/campaignDiscount"
import type { CampaignVariantEntry } from "@/features/customerPortal/lib/campaignRelevance"
import { getAssignedProductVariantImageUrl } from "@/lib/customers/assignedProductVariants"

type Props = {
    entry: CampaignVariantEntry
}

function formatDate(value: string | null) {
    if (!value) return null
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return null

    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(date)
}

export function CustomerPortalCampaignVariantCard({ entry }: Props) {
    const variant = entry.item.productVariant
    const product = variant?.product
    const until = formatDate(entry.validUntil)

    const variantHref = product?.slug
        ? `/musteri/tum-urunler/urun/${product.slug}/varyantlar`
        : null

    return (
        <article className="grid gap-3 overflow-hidden rounded-[26px] border border-neutral-200 bg-white p-3.5 shadow-sm transition hover:border-neutral-300 hover:shadow-md">
            <div className="flex items-start gap-3">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[22px] border border-neutral-200 bg-neutral-50">
                    {variant ? (
                        <Image
                            src={getAssignedProductVariantImageUrl(variant)}
                            alt={product?.name ?? variant.name}
                            fill
                            sizes="96px"
                            className="object-contain p-3"
                        />
                    ) : null}

                    <span className="absolute left-1.5 top-1.5 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                        {formatDiscountPercent(entry.discountPercent)}
                    </span>
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="gap-1.5 bg-rose-50 text-rose-700">
                            <Tag className="h-3.5 w-3.5" />
                            {entry.campaignTitle}
                        </Badge>
                        {entry.isRelevant ? (
                            <Badge variant="secondary" className="gap-1.5 bg-emerald-50 text-emerald-700">
                                <Sparkles className="h-3.5 w-3.5" />
                                Sizin listenizde
                            </Badge>
                        ) : null}
                    </div>

                    <div className="space-y-1">
                        <div className="font-mono text-[11px] font-semibold tracking-[0.08em] text-neutral-500">
                            {variant?.fullCode ?? entry.productVariantId}
                        </div>
                        <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-neutral-950">
                            {product?.name ?? variant?.name ?? "Ürün"}
                        </h2>
                        {variant?.color?.name ? (
                            <p className="line-clamp-1 text-xs text-neutral-500">{variant.color.name}</p>
                        ) : null}
                    </div>
                </div>
            </div>

            {entry.campaignDescription ? (
                <p className="line-clamp-2 rounded-[18px] bg-neutral-50 px-3 py-2 text-xs leading-5 text-neutral-600">
                    {entry.campaignDescription}
                </p>
            ) : null}

            <div className="flex items-center justify-between gap-2">
                {until ? (
                    <span className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {until} tarihine kadar
                    </span>
                ) : <span />}

                {variantHref ? (
                    <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-2xl">
                        <Link href={variantHref}>
                            İncele
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                ) : null}
            </div>
        </article>
    )
}
