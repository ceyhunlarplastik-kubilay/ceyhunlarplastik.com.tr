import Image from "next/image"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import ProductAssemblyVideoSection from "@/features/public/products/components/ProductAssemblyVideoSection"
import ProductAttributeBadges from "@/features/public/products/components/ProductAttributeBadges"
import ProductTechnicalDrawingSection from "@/features/public/products/components/ProductTechnicalDrawingSection"
import { getProductBySlug } from "@/features/public/products/server/getProductBySlug"
import { getProductVariantTable } from "@/features/public/products/server/getProductVariantTable"
import { buildMeasurementKey, formatMeasurementValue } from "@/features/public/products/utils/measurement"
import { CustomerPortalVariantPageHeader } from "@/features/customerPortal/components/CustomerPortalVariantPageHeader"
import { CustomerPortalVariantDetailsTable } from "@/features/customerPortal/components/CustomerPortalVariantDetailsTable"
import { AnimatedSplitProductTitle } from "@/features/public/products/components/AnimatedSplitProductTitle"
import { prisma } from "../../../../../../../core/src/core/db/prisma"
import { normalizeCustomerDiscountPercent } from "../../../../../../../core/src/core/helpers/pricing/customerPricing"

type PageProps = {
    params: Promise<{ slug: string }>
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function CustomerPortalVariantDetailPage({ params, searchParams }: PageProps) {
    const { slug } = await params
    const resolvedSearchParams = await searchParams
    const session = await auth()

    const measurementKey =
        typeof resolvedSearchParams?.m === "string" ? resolvedSearchParams.m : undefined

    const product = await getProductBySlug(slug)
    if (!product) notFound()

    const variants = await getProductVariantTable(product.id)
    const filtered = measurementKey
        ? variants.filter((variant) => buildMeasurementKey(variant.measurements) === measurementKey)
        : []

    const selectedMeasurements =
        filtered[0]?.measurements
            ?.slice()
            .sort((a, b) => a.measurementType.displayOrder - b.measurementType.displayOrder) ?? []
    const selectedMeasurementItems = selectedMeasurements.map((measurement) => {
        const shouldShowBaseUnit =
            Boolean(measurement.measurementType.baseUnit) &&
            measurement.measurementType.code !== "D" &&
            measurement.measurementType.code !== "M"
        const value = `${formatMeasurementValue(measurement)}${shouldShowBaseUnit ? ` ${measurement.measurementType.baseUnit}` : ""
            }`

        return {
            id: measurement.id,
            label: `${measurement.measurementType.name} (${measurement.measurementType.code})`,
            value,
        }
    })
    const selectedMeasurementSummary = selectedMeasurementItems.length > 0
        ? selectedMeasurementItems
            .map((measurement) => `${measurement.label}: ${measurement.value}`)
            .join(" / ")
        : "Ölçü seçimi yok"

    const primaryAsset = product.assets?.find(
        (asset) => asset?.role === "PRIMARY" && (asset?.type === "IMAGE" || asset?.type === undefined),
    )
    const fallbackAsset = product.assets?.find(
        (asset) => asset?.type === "IMAGE" || asset?.type === undefined,
    )
    const portalCustomer = session?.user?.customerId
        ? await prisma.customer.findUnique({
            where: { id: session.user.customerId },
            select: {
                generalDiscountPercent: true,
            },
        })
        : null

    return (
        <div className="space-y-6">
            <CustomerPortalVariantPageHeader
                productSlug={product.slug}
                productName={product.name}
                productCode={product.code}
                categoryName={product.category?.name ?? "Kategori"}
                selectedMeasurementSummary={selectedMeasurementSummary}
                variantCount={filtered.length}
                description={product.description}
            />

            <div className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="space-y-4">
                    <div className="grid items-stretch gap-3 lg:grid-cols-2">
                        <div className="relative flex h-full min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white sm:min-h-[420px]">
                            {(primaryAsset?.url ?? fallbackAsset?.url) ? (
                                <Image
                                    src={primaryAsset?.url ?? fallbackAsset?.url ?? "/placeholder.webp"}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-4"
                                    sizes="(min-width: 1024px) 50vw, 100vw"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                                    Görsel bulunamadı
                                </div>
                            )}
                        </div>

                        <div className="flex h-full min-h-[320px] flex-col justify-between gap-6 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 sm:min-h-[420px] sm:p-6">
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight">
                                    <AnimatedSplitProductTitle title={product.name} />
                                </h1>
                                <div className="mt-2 space-y-1 text-sm text-neutral-500">
                                    <p>Katalog Kodu: {product.code}</p>
                                    <p className="leading-6">
                                        Ölçüler: {selectedMeasurementSummary}
                                    </p>
                                </div>
                            </div>

                            <ProductAssemblyVideoSection
                                product={product}
                                videoOnly
                                autoPlayVideo
                                imageMinHeightPx={220}
                            />

                            <ProductAttributeBadges
                                attributeValues={product.attributeValues ?? []}
                            />
                        </div>
                    </div>

                    <div className="grid items-stretch gap-3 lg:grid-cols-2">
                        <div className="relative flex h-full min-h-[360px] items-center rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-5 shadow-sm">
                            <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-brand" />
                            <p className="pl-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                                {product.description || "Ürün açıklaması henüz eklenmemiştir."}
                            </p>
                        </div>

                        <div className="flex h-full min-h-[360px] min-w-0 flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3 shadow-sm sm:p-4">
                            <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                                <ProductTechnicalDrawingSection product={product} compact mediaOnly />
                            </div>

                            {/* <div className="rounded-xl border border-brand/15 bg-brand/5 p-4">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                                    Seçili Ölçü
                                </div>
                                {selectedMeasurementItems.length > 0 ? (
                                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                                        {selectedMeasurementItems.map((measurement) => (
                                            <div key={measurement.id} className="space-y-1">
                                                <dt className="text-xs font-medium text-brand/80">
                                                    {measurement.label}
                                                </dt>
                                                <dd className="text-sm font-semibold leading-6 text-neutral-900">
                                                    {measurement.value}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                ) : (
                                    <p className="mt-2 text-sm font-medium leading-6 text-neutral-900">
                                        Ölçü seçimi yok
                                    </p>
                                )}
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>

            <CustomerPortalVariantDetailsTable
                variants={filtered}
                selectedMeasurements={selectedMeasurements}
                productName={product.name}
                productId={product.id}
                productSlug={product.slug}
                productCode={product.code}
                productCategoryId={product.categoryId}
                categoryName={product.category?.name}
                customerDiscountPercent={normalizeCustomerDiscountPercent(portalCustomer?.generalDiscountPercent)}
                productImageUrl={primaryAsset?.url ?? fallbackAsset?.url ?? "/placeholder.webp"}
            />
        </div>
    )
}
