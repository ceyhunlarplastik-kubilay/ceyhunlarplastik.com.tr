import { notFound } from "next/navigation"

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
                <ProductVariantDetailsTable
                    variants={filtered}
                    selectedMeasurements={selectedMeasurements}
                />
            </section>
        </main>
    )
}
