import { notFound } from "next/navigation"
import Image from "next/image"

import { PageHero } from "@/components/sections/PageHero"
import ProductVariantDetailsTable from "@/features/public/products/components/ProductVariantDetailsTable"
import ProductVariantHeaderActions from "@/features/public/products/components/ProductVariantHeaderActions"
import ProductTechnicalDrawingSection from "@/features/public/products/components/ProductTechnicalDrawingSection"
import { getProductBySlug } from "@/features/public/products/server/getProductBySlug"
import { getProductVariantTable } from "@/features/public/products/server/getProductVariantTable"
import { buildMeasurementKey } from "@/features/public/products/utils/measurement"

type PageProps = {
    params: Promise<{ slug: string }>
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProductVariantDetailsPage({ params, searchParams }: PageProps) {
    const { slug } = await params
    const resolvedSearchParams = await searchParams

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
    const selectedVariant = filtered[0]
    const resolvedVariantKey =
        measurementKey ??
        (selectedVariant ? buildMeasurementKey(selectedVariant.measurements) : "all")

    const primaryAsset = product.assets?.find((asset) => asset?.role === "PRIMARY")

    return (
        <main>
            <PageHero
                title={`${product.name} - Varyant Detayı`}
                breadcrumbs={[
                    { label: "Ana Sayfa", href: "/" },
                    { label: "Ürünler", href: "/urunler" },
                    { label: product.category?.name || "Kategori Yok", href: product.category?.slug ? `/urun-kategori/${product.category.slug}` : "/" },
                    { label: product.name, href: `/urun/${product.slug}` },
                    { label: "Varyant Detayı" },
                ]}
            />

            <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 space-y-6">
                <div className="grid gap-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-2 lg:gap-8">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm">
                        {primaryAsset?.url ? (
                            <Image
                                src={primaryAsset.url}
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

                    <div className="flex flex-col justify-center space-y-4">
                        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{product.name}</h2>
                        <p className="text-sm text-neutral-500">Ürün Kodu: {product.code}</p>
                        {product.description && (
                            <p className="text-sm leading-7 text-neutral-700">{product.description}</p>
                        )}
                        <ProductVariantHeaderActions
                            productId={product.id}
                            productSlug={product.slug}
                            productName={product.name}
                            productCode={product.code}
                            variantKey={resolvedVariantKey}
                            variantId={selectedVariant?.id}
                            variantFullCode={selectedVariant?.fullCode}
                        />
                    </div>
                </div>

                <ProductVariantDetailsTable
                    variants={filtered}
                    selectedMeasurements={selectedMeasurements}
                    technicalDrawing={<ProductTechnicalDrawingSection product={product} compact />}
                    productName={product.name}
                    categoryName={product.category?.name}
                />
            </section>
        </main>
    )
}
