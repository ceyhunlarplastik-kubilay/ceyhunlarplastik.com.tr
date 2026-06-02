import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth/auth"
import ProductTechnicalDrawingSection from "@/features/public/products/components/ProductTechnicalDrawingSection"
import { getProductBySlug } from "@/features/public/products/server/getProductBySlug"
import { getProductVariantTable } from "@/features/public/products/server/getProductVariantTable"
import { buildMeasurementKey, formatMeasurementValue } from "@/features/public/products/utils/measurement"
import { CustomerPortalVariantDetailsTable } from "@/features/customerPortal/components/CustomerPortalVariantDetailsTable"
import { Badge } from "@/components/ui/badge"
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
            <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                <Button asChild variant="ghost" className="px-0 text-neutral-500 hover:bg-transparent hover:text-neutral-900">
                    <Link href={`/musteri/tum-urunler/urun/${product.slug}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Ürün Modeline Dön
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-2 lg:gap-8">
                <div className="space-y-4">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm">
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

                    <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4 sm:px-5">
                        <div className="space-y-3">
                            <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                                {product.category?.name ?? "Kategori"}
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{product.name}</h1>
                            <p className="text-sm font-medium text-neutral-500">Ürün Kodu: {product.code}</p>
                            {product.description ? (
                                <p className="text-sm leading-7 text-neutral-700">{product.description}</p>
                            ) : (
                                <p className="text-sm leading-7 text-neutral-400">
                                    Bu ürün modeli için henüz açıklama eklenmemiştir.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center space-y-4">
                    <div className="min-w-0 overflow-hidden rounded-[24px] border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
                        <ProductTechnicalDrawingSection product={product} compact />
                    </div>

                    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 text-sm font-medium text-neutral-700">Seçilen Ölçü</div>
                        <div className="flex flex-col items-start gap-2">
                            {selectedMeasurements.length === 0 ? (
                                <p className="text-sm text-neutral-400">Geçerli bir ölçü seçimi bulunamadı.</p>
                            ) : (
                                selectedMeasurements.map((measurement) => (
                                    <Badge key={measurement.id} variant="secondary" className="w-full justify-start text-left">
                                        {measurement.measurementType.name} ({measurement.measurementType.code}):{" "}
                                        {formatMeasurementValue(measurement)}
                                        {measurement.measurementType.baseUnit &&
                                        measurement.measurementType.code !== "D" &&
                                        measurement.measurementType.code !== "M"
                                            ? ` ${measurement.measurementType.baseUnit}`
                                            : ""}
                                    </Badge>
                                ))
                            )}
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
                categoryName={product.category?.name}
                customerDiscountPercent={normalizeCustomerDiscountPercent(portalCustomer?.generalDiscountPercent)}
                productImageUrl={primaryAsset?.url ?? fallbackAsset?.url ?? "/placeholder.webp"}
            />
        </div>
    )
}
