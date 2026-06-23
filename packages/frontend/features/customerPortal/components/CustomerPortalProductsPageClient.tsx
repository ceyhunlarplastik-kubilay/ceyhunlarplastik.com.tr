"use client"

import { useMemo } from "react"
import { BookMarked } from "lucide-react"
import { ProductCard } from "@/components/navigation/ProductCard"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import type { CustomerFeaturedProduct } from "@/features/admin/customers/api/types"
import { CustomerPortalAssignedVariantsPageClient } from "@/features/customerPortal/components/CustomerPortalAssignedVariantsPageClient"
import { usePortalFeaturedProducts } from "@/features/customerPortal/hooks/usePortalFeaturedProducts"
import {
    CustomerPortalPageHeader,
    CustomerPortalPageHeaderStat,
} from "@/features/customerPortal/components/CustomerPortalPageHeader"

const INLINE_USAGE_AREA_LIMIT = 2

type Props = {
    mode?: "featured" | "assigned"
}

export function CustomerPortalProductsPageClient({ mode = "featured" }: Props) {
    if (mode === "assigned") {
        return <CustomerPortalAssignedVariantsPageClient />
    }

    return <CustomerPortalFeaturedProductsContent />
}

function CustomerPortalFeaturedProductsContent() {
    const featuredQuery = usePortalFeaturedProducts()
    const featuredProducts = useMemo(
        () =>
            [...(featuredQuery.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder),
        [featuredQuery.data],
    )

    const content = {
        chip: "Müşteriye Özel Ürünler",
        title: "İlgili Ürünler",
        description: "Satış temsilcimizin öne çıkardığı ürünleri ve profil eşleşmenize göre ilgili bulunan ürünleri burada bulabilirsiniz.",
        countDescription: "Firmanızla ilişkili ürünler",
        emptyMessage: "Henüz firmanız için ilgili ürün bulunmuyor.",
    }

    return (
        <div className="space-y-6">
            <CustomerPortalPageHeader
                eyebrow={content.chip}
                icon={BookMarked}
                title={content.title}
                description={content.description}
                meta={[
                    { value: `${featuredProducts.length}`, label: "ürün" },
                ]}
                aside={(
                    <CustomerPortalPageHeaderStat
                        label={content.countDescription}
                        value={`${featuredProducts.length} ürün`}
                    />
                )}
            />

            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                {featuredQuery.isLoading ? (
                    <div className="flex min-h-[320px] items-center justify-center">
                        <Spinner className="size-5" />
                    </div>
                ) : featuredProducts.length > 0 ? (
                    <ul className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                        {featuredProducts.map((item) => {
                            const primary = item.product.assets?.find((asset: { role?: string }) => asset.role === "PRIMARY")
                            const animated = item.product.assets?.find((asset: { role?: string }) => asset.role === "ANIMATION")
                            const fallback = item.product.assets?.find((asset: { type?: string }) => asset.type === "IMAGE")

                            return (
                                <li key={item.id}>
                                    <div className="space-y-2">
                                        <ProductCard
                                            title={item.product.name}
                                            code={item.product.code}
                                            href={`/musteri/tum-urunler/urun/${item.product.slug}`}
                                            imageStatic={primary?.url || fallback?.url || "/placeholder.webp"}
                                            imageAnimated={animated?.url}
                                            attributeValues={item.product.attributeValues}
                                            showSpecialAttributeValues
                                        />
                                        <ProductRecommendationReason item={item} />
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                ) : (
                    <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
                        {content.emptyMessage}
                    </div>
                )}
            </div>
        </div>
    )
}

function ProductRecommendationReason({ item }: { item: CustomerFeaturedProduct }) {
    const recommendation = useMemo(() => buildUsageAreaRecommendation(item), [item])
    const isManual = item.source !== "ATTRIBUTE_MATCH"
    const isProfileMatched = item.isProfileMatched || item.source === "ATTRIBUTE_MATCH"

    if (!recommendation) {
        return (
            <div className="flex min-h-8 flex-wrap items-center justify-center gap-1.5 px-1">
                {isManual ? (
                    <span className="inline-flex max-w-full items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        Satış temsilcisi seçimi
                    </span>
                ) : null}
                {isProfileMatched ? (
                    <span className="inline-flex max-w-full items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                        Profil eşleşmesi
                    </span>
                ) : null}
            </div>
        )
    }

    const visibleAreas = recommendation.names.slice(0, INLINE_USAGE_AREA_LIMIT)
    const hiddenAreas = recommendation.names.slice(INLINE_USAGE_AREA_LIMIT)
    const hasHiddenAreas = hiddenAreas.length > 0

    return (
        <Dialog>
            <div className="flex min-h-8 flex-wrap items-center justify-center gap-1.5 px-1">
                {isManual ? (
                    <span className="inline-flex max-w-full items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        Satış temsilcisi seçimi
                    </span>
                ) : null}

                {isProfileMatched ? (
                    <span className="inline-flex max-w-full items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                        {/*Mantıksal olarak >  Profil eşleşmesi */}
                        Kullanıldığı Endüstriyel Ürünler
                    </span>
                ) : null}

                {visibleAreas.map((name) => (
                    <span
                        key={name}
                        title={name}
                        className="inline-flex max-w-[9rem] items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800"
                    >
                        <span className="truncate">{name}</span>
                    </span>
                ))}

                {hasHiddenAreas ? (
                    <DialogTrigger asChild>
                        <button
                            type="button"
                            className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                        >
                            +{hiddenAreas.length} daha
                        </button>
                    </DialogTrigger>
                ) : null}
            </div>

            {hasHiddenAreas ? (
                <DialogContent className="max-w-lg rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>Öneri Eşleşmeleri</DialogTitle>
                        <DialogDescription>
                            Bu ürünün müşteri profilinizle eşleşen kullanım alanları.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[55vh] pr-3">
                        <div className="flex flex-wrap gap-2 py-1">
                            {recommendation.names.map((name) => (
                                <span
                                    key={name}
                                    className="inline-flex max-w-full items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                                >
                                    {name}
                                </span>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            ) : null}
        </Dialog>
    )
}

function buildUsageAreaRecommendation(item: CustomerFeaturedProduct) {
    const matchedIds = new Set(item.matchedAttributeValueIds ?? [])
    const allUsageAreas = new Map<string, string>()
    const matchedUsageAreas = new Map<string, string>()

    for (const usage of item.product.industrialUsages ?? []) {
        const usageAreaId =
            typeof usage.usageAreaValue?.id === "string"
                ? usage.usageAreaValue.id
                : usage.usageAreaValueId

        const usageAreaName =
            typeof usage.usageAreaValue?.name === "string"
                ? usage.usageAreaValue.name.trim()
                : ""

        if (!usageAreaId || !usageAreaName) {
            continue
        }

        allUsageAreas.set(usageAreaId, usageAreaName)

        if (matchedIds.has(usageAreaId)) {
            matchedUsageAreas.set(usageAreaId, usageAreaName)
        }
    }

    const names = Array.from(
        (matchedUsageAreas.size > 0 ? matchedUsageAreas : allUsageAreas).values(),
    )

    return names.length > 0 ? { names } : null
}
