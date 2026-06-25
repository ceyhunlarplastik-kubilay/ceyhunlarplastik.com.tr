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
                <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
                    <div className="relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-white">
                        {(primaryAsset?.url ?? fallbackAsset?.url) ? (
                            <Image
                                src={primaryAsset?.url ?? fallbackAsset?.url ?? "/placeholder.webp"}
                                alt={product.name}
                                fill
                                className="object-contain"
                                sizes="(min-width: 1024px) 50vw, 100vw"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                                Görsel bulunamadı
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {product.name}
                            </h1>
                            <p className="mt-2 text-neutral-500">
                                Katalog Kodu: {product.code}
                            </p>
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

                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(220px,0.85fr)] lg:items-stretch">
                            <div className="min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-3 shadow-sm sm:p-4">
                                <ProductTechnicalDrawingSection product={product} compact mediaOnly />
                            </div>

                            <div className="flex flex-col justify-center rounded-xl border border-brand/15 bg-brand/5 p-4 shadow-sm">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                                    Seçili Ölçü
                                </div>
                                {selectedMeasurementItems.length > 0 ? (
                                    <dl className="mt-3 space-y-3">
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
                            </div>
                        </div>

                        {product.description ? (
                            <div className="relative rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-5 shadow-sm">
                                <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-brand" />
                                <p className="pl-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                                    {product.description}
                                </p>
                            </div>
                        ) : null}
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
