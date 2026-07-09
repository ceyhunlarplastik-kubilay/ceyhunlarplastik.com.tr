import { notFound } from "next/navigation"
import Image from "next/image"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { PageHero } from "@/components/sections/PageHero"
import ProductVariantDetailsTable from "@/features/public/products/components/ProductVariantDetailsTable"
import ProductVariantHeaderActions from "@/features/public/products/components/ProductVariantHeaderActions"
import ProductTechnicalDrawingSection from "@/features/public/products/components/ProductTechnicalDrawingSection"
import { getProductBySlug } from "@/features/public/products/server/getProductBySlug"
import { getProductVariantTable } from "@/features/public/products/server/getProductVariantTable"
import { buildMeasurementKey } from "@/features/public/products/utils/measurement"

type PageProps = {
    params: Promise<{ locale: string; slug: string }>
    searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale, slug } = await params

    const [t, product] = await Promise.all([
        getTranslations({ locale, namespace: "public.productVariant" }),
        getProductBySlug(slug),
    ])

    if (!product) return {}

    const canonicalPath = locale === "tr" ? `/urun/${product.slug}/varyantlar` : `/en/urun/${product.slug}/varyantlar`

    return {
        title: t("pageTitle", { name: product.name }),
        description: t("metaDescription", { name: product.name }),
        openGraph: {
            title: t("pageTitle", { name: product.name }),
            description: t("metaDescription", { name: product.name }),
            type: "website",
            locale: locale === "tr" ? "tr_TR" : "en_US",
        },
        alternates: {
            canonical: canonicalPath,
            languages: {
                tr: `/urun/${product.slug}/varyantlar`,
                en: `/en/urun/${product.slug}/varyantlar`,
                "x-default": `/urun/${product.slug}/varyantlar`,
            },
        },
    }
}

export default async function ProductVariantDetailsPage({ params, searchParams }: PageProps) {
    const { locale, slug } = await params
    setRequestLocale(locale)
    const resolvedSearchParams = await searchParams

    const measurementKey =
        typeof resolvedSearchParams?.m === "string" ? resolvedSearchParams.m : undefined

    const product = await getProductBySlug(slug)
    if (!product) notFound()

    const [tb, t, variants] = await Promise.all([
        getTranslations({ locale, namespace: "shared.breadcrumbs" }),
        getTranslations({ locale, namespace: "public.productVariant" }),
        getProductVariantTable(product.id),
    ])

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
                title={t("pageTitle", { name: product.name })}
                breadcrumbs={[
                    { label: tb("home"), href: "/" },
                    { label: t("breadcrumbProducts"), href: "/urunler" },
                    { label: product.category?.name || t("categoryFallback"), href: product.category?.slug ? `/urun-kategori/${product.category.slug}` : "/" },
                    { label: product.name, href: `/urun/${product.slug}` },
                    { label: t("breadcrumbVariant") },
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
                                {t("imageNotFound")}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-center space-y-4">
                        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">{product.name}</h2>
                        <p className="text-sm text-neutral-500">{t("productCode", { code: product.code })}</p>
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
