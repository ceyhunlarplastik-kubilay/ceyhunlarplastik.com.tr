"use client"

import { ArrowRight, BookMarked, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ButtonShine } from "@/components/ui/button-shine"
import {
    FramerThumbnailCarousel,
    type FramerThumbnailCarouselItem,
} from "@/components/ui/framer-thumbnail-carousel"
import type { AdminCustomer, CustomerAttributeValue } from "@/features/admin/customers/api/types"

type Props = {
    customer: AdminCustomer
}

const HIERARCHY_ATTRIBUTE_CODES = new Set(["sector", "production_group", "usage_area"])

function getAssetUrl(value: CustomerAttributeValue) {
    const primaryAsset = value.assets?.find((asset) => asset.role === "PRIMARY")
    return primaryAsset?.url ?? value.assets?.[0]?.url ?? null
}

function buildUsageAreaItems(customer: AdminCustomer): FramerThumbnailCarouselItem[] {
    return (customer.usageAreaValues ?? []).map((value) => ({
        id: value.id,
        title: value.name,
        eyebrow: "Kullanım Alanı",
        imageUrl: getAssetUrl(value),
        description: [
            customer.sectorValue?.name ? `Sektör: ${customer.sectorValue.name}` : null,
            customer.productionGroupValue?.name ? `Üretim grubu: ${customer.productionGroupValue.name}` : null,
        ].filter(Boolean).join(" · "),
        badge: <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">Profil eşleşmesi</Badge>,
    }))
}

export function CustomerPortalUsageAreaCarousel({ customer }: Props) {
    const usageAreaItems = buildUsageAreaItems(customer)
    const genericProfileAssignments = (customer.attributeValueAssignments ?? []).filter(
        (assignment) => !HIERARCHY_ATTRIBUTE_CODES.has(assignment.attributeValue.attribute?.code ?? ""),
    )

    return (
        <section className="flex h-full min-w-0 flex-col rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                        <BookMarked className="h-3.5 w-3.5" />
                        Sektörel Eşleşme
                    </div>
                    {/* <p className="mt-2 text-sm leading-6 text-neutral-500">
                        Firma profilinizdeki kullanım alanları görsel olarak öne çıkarılır.
                    </p> */}
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* {customer.sectorValue?.name ? <Badge variant="secondary">{customer.sectorValue.name}</Badge> : null}
                    {customer.productionGroupValue?.name ? <Badge variant="outline">{customer.productionGroupValue.name}</Badge> : null} */}
                    <ButtonShine
                        href="/musteri/tanimli-urunler"
                        size="sm"
                        className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] shadow-[0_18px_35px_-18px_color-mix(in_oklch,var(--color-brand),black_35%)]"
                        ariaLabel="Profiliniz ile eslesen urunlere git"
                    >
                        <span className="relative z-10 inline-flex items-center gap-2">
                            <Sparkles className="size-3.5" />
                            Benimle İlgili Endüstriyel Ürünler
                            <ArrowRight className="size-3.5" />
                        </span>
                    </ButtonShine>
                </div>
            </div>

            <FramerThumbnailCarousel
                items={usageAreaItems}
                emptyTitle="Kullanım alanı seçilmedi"
                emptyDescription="Müşteri profilinizde kullanım alanı tanımlandığında burada görsel bir eşleşme önizlemesi görünür."
                imagePresentation="square"
                className="min-w-0"
            />

            {genericProfileAssignments.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                    {genericProfileAssignments.map((assignment) => (
                        <Badge key={assignment.id} variant="outline">
                            {assignment.attributeValue.attribute?.name ? `${assignment.attributeValue.attribute.name}: ` : ""}
                            {assignment.attributeValue.name}
                        </Badge>
                    ))}
                </div>
            ) : null}
        </section>
    )
}
