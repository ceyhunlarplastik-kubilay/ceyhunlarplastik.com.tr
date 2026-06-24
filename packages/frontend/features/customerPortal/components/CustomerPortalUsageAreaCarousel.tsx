"use client"

import { useMemo, useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { ArrowRight, BookMarked, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ButtonShine } from "@/components/ui/button-shine"
import {
    FramerThumbnailCarousel,
    type FramerThumbnailCarouselItem,
} from "@/components/ui/framer-thumbnail-carousel"
import type { AdminCustomer, CustomerAttributeValue } from "@/features/admin/customers/api/types"
import { CustomerPortalUsageAreaProductRail } from "@/features/customerPortal/components/usageArea/CustomerPortalUsageAreaProductRail"
import { fetchProducts } from "@/features/public/products/api/fetchProducts"

type Props = {
    customer: AdminCustomer
}

const HIERARCHY_ATTRIBUTE_CODES = new Set(["sector", "production_group", "usage_area"])
const USAGE_AREA_PRODUCTS_PAGE_SIZE = 8
const EMPTY_USAGE_AREA_VALUES: CustomerAttributeValue[] = []

function getAssetUrl(value: CustomerAttributeValue) {
    const primaryAsset = value.assets?.find((asset) => asset.role === "PRIMARY")
    return primaryAsset?.url ?? value.assets?.[0]?.url ?? null
}

function buildUsageAreaItems(
    customer: AdminCustomer,
    usageAreaValues: CustomerAttributeValue[],
): FramerThumbnailCarouselItem[] {
    return usageAreaValues.map((value) => ({
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
    const usageAreaValues = customer.usageAreaValues ?? EMPTY_USAGE_AREA_VALUES
    const usageAreaItems = useMemo(
        () => buildUsageAreaItems(customer, usageAreaValues),
        [customer, usageAreaValues],
    )
    const genericProfileAssignments = useMemo(
        () => (customer.attributeValueAssignments ?? []).filter(
            (assignment) => !HIERARCHY_ATTRIBUTE_CODES.has(assignment.attributeValue.attribute?.code ?? ""),
        ),
        [customer.attributeValueAssignments],
    )
    const [activeUsageAreaIndex, setActiveUsageAreaIndex] = useState(0)
    const boundedUsageAreaIndex = Math.min(
        activeUsageAreaIndex,
        Math.max(usageAreaValues.length - 1, 0),
    )
    const selectedUsageArea = usageAreaValues[boundedUsageAreaIndex] ?? null
    const usageAreaProductsQuery = useInfiniteQuery({
        queryKey: [
            "customer-portal-usage-area-products",
            selectedUsageArea?.slug ?? null,
            USAGE_AREA_PRODUCTS_PAGE_SIZE,
        ],
        initialPageParam: 1,
        enabled: Boolean(selectedUsageArea?.slug),
        staleTime: 1000 * 60 * 5,
        queryFn: async ({ pageParam }) => {
            if (!selectedUsageArea?.slug) {
                throw new Error("Usage area slug is required.")
            }

            return fetchProducts({
                page: pageParam,
                limit: USAGE_AREA_PRODUCTS_PAGE_SIZE,
                usage_area: selectedUsageArea.slug,
            })
        },
        getNextPageParam: (lastPage) =>
            lastPage.meta.page < lastPage.meta.totalPages
                ? lastPage.meta.page + 1
                : undefined,
    })

    const usageAreaProducts = useMemo(
        () => usageAreaProductsQuery.data?.pages.flatMap((page) => page.data) ?? [],
        [usageAreaProductsQuery.data],
    )
    const totalUsageAreaProducts = usageAreaProductsQuery.data?.pages[0]?.meta.total ?? 0
    const allProductsHref = selectedUsageArea
        ? `/musteri/tum-urunler?usage_area=${selectedUsageArea.slug}`
        : "/musteri/tum-urunler"
    const isInitialProductsLoading = !usageAreaProductsQuery.data && usageAreaProductsQuery.isFetching

    return (
        <section className="flex h-full min-w-0 flex-col rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                        <BookMarked className="h-3.5 w-3.5" />
                        Sektörel Eşleşme
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <ButtonShine
                        href="/musteri/tanimli-urunler"
                        target="_blank"
                        rel="noopener noreferrer"
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
                index={boundedUsageAreaIndex}
                onIndexChange={setActiveUsageAreaIndex}
            />

            <CustomerPortalUsageAreaProductRail
                selectedUsageArea={selectedUsageArea}
                allProductsHref={allProductsHref}
                products={usageAreaProducts}
                totalProducts={totalUsageAreaProducts}
                pageSize={USAGE_AREA_PRODUCTS_PAGE_SIZE}
                isInitialLoading={isInitialProductsLoading}
                hasNextPage={Boolean(usageAreaProductsQuery.hasNextPage)}
                isFetchingNextPage={usageAreaProductsQuery.isFetchingNextPage}
                onLoadMore={() => void usageAreaProductsQuery.fetchNextPage()}
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
