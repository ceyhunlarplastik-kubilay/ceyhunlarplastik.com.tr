import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { PageHero } from "@/components/sections/PageHero"
import { getProductBySlug } from "@/features/public/products/server/getProductBySlug"
import { getProductVariantTable } from "@/features/public/products/server/getProductVariantTable"
import { getProductsByCategory } from "@/features/public/products/server/getProductsByCategory"

import ProductHero from "@/features/public/products/components/ProductHero"
import ProductMediaRow from "@/features/public/products/components/ProductMediaRow"
import ProductTechnicalDrawingSection from "@/features/public/products/components/ProductTechnicalDrawingSection"
import Product3DModelSection from "@/features/public/products/components/Product3DModelSection"
import ProductAssemblyVideoSection from "@/features/public/products/components/ProductAssemblyVideoSection"
import ProductCertificateSection from "@/features/public/products/components/ProductCertificateSection"
import ProductVariantTable from "@/features/public/products/components/ProductVariantTable"
import { groupVariantMeasurements } from "@/features/public/products/utils/groupVariantMeasurements"
import ProductUsageAreasTable from "@/features/public/products/components/ProductUsageAreasTable"
import SimilarProductsRow from "@/features/public/products/components/SimilarProductsRow"
import { toSimilarProductItems } from "@/features/public/products/utils/similarProducts"

export const revalidate = 60

type PageProps = {
    params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata(
    { params }: PageProps
): Promise<Metadata> {

    const { locale, slug } = await params

    const [t, product] = await Promise.all([
        getTranslations({ locale, namespace: "public.productDetail" }),
        getProductBySlug(slug, locale),
    ])

    if (!product) return {}

    const turkishSlug = product.alternateSlugs?.tr ?? product.slug
    const englishSlug = product.translationMissing
        ? undefined
        : product.alternateSlugs?.en
    const canonicalSlug = locale === "tr"
        ? turkishSlug
        : englishSlug ?? product.slug
    const canonicalPath = locale === "tr" ? `/urun/${canonicalSlug}` : `/en/urun/${canonicalSlug}`
    const turkishUrl = `/urun/${turkishSlug}`
    const englishUrl = englishSlug ? `/en/urun/${englishSlug}` : undefined
    const languages = {
        tr: turkishUrl,
        "x-default": turkishUrl,
        ...(englishUrl ? { en: englishUrl } : {}),
    }

    return {
        // Root layout template "| Ceyhunlar Plastik" ekler
        title: product.name,
        description: t("metaDescription", { name: product.name }),
        openGraph: {
            title: product.name,
            description: t("ogDescription", { name: product.name }),
            type: "website",
            locale: locale === "tr" ? "tr_TR" : "en_US",
        },
        robots: locale !== "tr" && product.translationMissing
            ? { index: false, follow: true }
            : undefined,
        alternates: {
            canonical: canonicalPath,
            languages,
        },
    }
}

export default async function ProductPage({ params }: PageProps) {

    const { locale, slug } = await params
    setRequestLocale(locale)

    const [tb, tf, product] = await Promise.all([
        getTranslations({ locale, namespace: "shared.breadcrumbs" }),
        getTranslations({ locale, namespace: "public.productDetail" }),
        getProductBySlug(slug, locale),
    ])

    if (!product) notFound()

    const [variantTable, productsByCategory] = await Promise.all([
        getProductVariantTable(product.id, { locale }),
        // 13 = 12 benzer ürün + ürünün kendisi ilk sayfadaysa yedek.
        getProductsByCategory(product.categoryId, "id", { locale, limit: 13 }),
    ])

    const similarProducts = toSimilarProductItems(productsByCategory, product.id)

    return (
        <main>

            <PageHero
                title={product.name}
                breadcrumbs={[
                    { label: tb("home"), href: "/" },
                    { label: tf("breadcrumbProducts"), href: "/urunler" },
                    { label: product.category?.name || tf("categoryFallback"), href: product.category?.slug ? `/urun-kategori/${product.category.slug}` : "/" },
                    { label: product.name }
                ]}
            />

            <section className="mx-auto w-full max-w-[96rem] px-4 py-5 lg:px-5">

                {/* PRODUCT HERO */}
                <div id="product-hero">
                    <ProductHero product={product} />
                </div>

                {/* MEDIA ROW */}
                {/* <div id="product-media">
                    <ProductMediaRow product={product} />
                </div> */}

            </section>

            <section className="mx-auto w-full max-w-[96rem] px-4 pb-20 lg:px-5">

                <div id="product-variants">
                    <ProductVariantTable
                        options={groupVariantMeasurements(variantTable.variants)}
                        loadError={variantTable.error}
                        productSlug={product.slug}
                        productId={product.id}
                        technicalDrawing={
                            <div id="product-technical-drawing">
                                <ProductTechnicalDrawingSection product={product} compact />
                            </div>
                        }
                    />
                </div>
                <ProductUsageAreasTable product={product} />
                <div id="product-3d-model">
                    <Product3DModelSection product={product} />
                </div>
                <div id="product-assembly-video">
                    <ProductAssemblyVideoSection product={product} />
                </div>
                <div id="product-certificate">
                    <ProductCertificateSection product={product} />
                </div>
                <SimilarProductsRow products={similarProducts} />

            </section>

        </main>
    )
}
