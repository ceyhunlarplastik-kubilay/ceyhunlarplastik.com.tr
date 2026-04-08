import { notFound } from "next/navigation"
import Image from "next/image"

import { PageHero } from "@/components/sections/PageHero"
import ProductVariantDetailsTable from "@/features/public/products/components/ProductVariantDetailsTable"
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

            <section className="mx-auto max-w-7xl px-6 py-12 space-y-6">
                <div className="grid gap-6 rounded-xl border border-neutral-200 bg-white p-5 md:grid-cols-[220px_1fr]">
                    <div className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                        {primaryAsset?.url ? (
                            <Image
                                src={primaryAsset.url}
                                alt={product.name}
                                fill
                                className="object-contain"
                                sizes="(min-width: 768px) 220px, 100vw"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                                Görsel bulunamadı
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-neutral-900">{product.name}</h2>
                        <p className="text-sm text-neutral-500">Katalog Kodu: {product.code}</p>
                        {product.description && (
                            <p className="text-sm leading-6 text-neutral-700">{product.description}</p>
                        )}
                    </div>
                </div>

                <ProductVariantDetailsTable
                    variants={filtered}
                    selectedMeasurements={selectedMeasurements}
                />
            </section>
        </main>
    )
}
