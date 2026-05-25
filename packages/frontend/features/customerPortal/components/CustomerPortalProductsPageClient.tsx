"use client"

import { useMemo } from "react"
import { BookMarked, Boxes } from "lucide-react"
import { ProductCard } from "@/components/navigation/ProductCard"
import { Spinner } from "@/components/ui/spinner"
import { usePortalAssignedProducts } from "@/features/customerPortal/hooks/usePortalAssignedProducts"
import { usePortalFeaturedProducts } from "@/features/customerPortal/hooks/usePortalFeaturedProducts"
import {
    CustomerPortalPageHeader,
    CustomerPortalPageHeaderStat,
} from "@/features/customerPortal/components/CustomerPortalPageHeader"

type Props = {
    mode?: "featured" | "assigned"
}

export function CustomerPortalProductsPageClient({ mode = "featured" }: Props) {
    const featuredQuery = usePortalFeaturedProducts()
    const assignedQuery = usePortalAssignedProducts()
    const query = mode === "assigned" ? assignedQuery : featuredQuery
    const featuredProducts = useMemo(
        () =>
            [...(query.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder),
        [query.data],
    )

    const content = mode === "assigned"
        ? {
            chip: "Tanımlı Ürün Portföyü",
            title: "Tanımlı Ürünler",
            description: "Firmanız için sürekli veya yüksek hacimde çalışılan ürünleri burada takip edebilirsiniz.",
            countDescription: "Operasyonel ürün portföyünüz",
            emptyMessage: "Henüz firmanız için tanımlı ürün bulunmuyor.",
        }
        : {
            chip: "Müşteriye Özel Ürünler",
            title: "İlgili Ürünler",
            description: "Satış temsilcimiz tarafından firmanızla ilgili görülen ürünleri burada bulabilirsiniz.",
            countDescription: "Firmanızla ilişkili ürünler",
            emptyMessage: "Henüz firmanız için ilgili ürün bulunmuyor.",
        }

    return (
        <div className="space-y-6">
            <CustomerPortalPageHeader
                eyebrow={content.chip}
                icon={mode === "assigned" ? Boxes : BookMarked}
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
                {query.isLoading ? (
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
                                    <ProductCard
                                        title={item.product.name}
                                        code={item.product.code}
                                        href={`/musteri/tum-urunler/urun/${item.product.slug}`}
                                        imageStatic={primary?.url || fallback?.url || "/placeholder.webp"}
                                        imageAnimated={animated?.url}
                                        attributeValues={item.product.attributeValues}
                                        showSpecialAttributeValues
                                    />
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
