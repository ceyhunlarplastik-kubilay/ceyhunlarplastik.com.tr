import { notFound } from "next/navigation"
import type { Metadata } from "next"

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
import ProductUsageAreasTable from "@/features/public/products/components/ProductUsageAreasTable"
import SimilarProductsRow from "@/features/public/products/components/SimilarProductsRow"

export const revalidate = 60

type PageProps = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata(
    { params }: PageProps
): Promise<Metadata> {

    const { slug } = await params

    const product = await getProductBySlug(slug)

    if (!product) return {}

    return {
        title: `${product.name} | Ceyhunlar Plastik`,
        description: `${product.name} ürününü inceleyin.`,
        openGraph: {
            title: product.name,
            description: `${product.name} ürün detay sayfası`,
            type: "website",
            url: `https://ceyhunlarplastik.com.tr/urun/${product.slug}`,
        },
        alternates: {
            canonical: `https://ceyhunlarplastik.com.tr/urun/${product.slug}`,
        },
    }
}

export default async function ProductPage({ params }: PageProps) {

    const { slug } = await params

    const product = await getProductBySlug(slug)

    if (!product) notFound()

    const variants = await getProductVariantTable(product.id)
    const productsByCategory = await getProductsByCategory(product.categoryId, "id")
    const similarProducts = productsByCategory
        .filter((item) => item.id !== product.id)
        .slice(0, 12)

    return (
        <main>

            <PageHero
                title={product.name}
                breadcrumbs={[
                    { label: "Ana Sayfa", href: "/" },
                    { label: "Ürünler", href: "/urunler" },
                    /* { label: product.category.name, href: `/kategori/${product.category.slug}` }, */
                    { label: product.category?.name || "Kategori Yok", href: product.category?.slug ? `/urun-kategori/${product.category.slug}` : "/" },
                    { label: product.name }
                ]}
            />

            <section className="mx-auto max-w-7xl px-6 py-6">

                {/* PRODUCT HERO */}
                <div id="product-hero">
                    <ProductHero product={product} />
                </div>

                {/* MEDIA ROW */}
                {/* <div id="product-media">
                    <ProductMediaRow product={product} />
                </div> */}

            </section>

            <section className="mx-auto max-w-7xl px-6 pb-24">

                <div id="product-variants">
                    <ProductVariantTable variants={variants} productSlug={product.slug} />
                </div>
                <ProductUsageAreasTable product={product} />
                <div id="product-technical-drawing">
                    <ProductTechnicalDrawingSection product={product} />
                </div>
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
