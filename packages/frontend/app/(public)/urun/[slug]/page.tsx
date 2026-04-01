import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { PageHero } from "@/components/sections/PageHero"
import { getProductBySlug } from "@/features/public/products/server/getProductBySlug"
import { getProductVariantTable } from "@/features/public/products/server/getProductVariantTable"

import ProductHero from "@/features/public/products/components/ProductHero"
import ProductMediaRow from "@/features/public/products/components/ProductMediaRow"
import ProductVariantTable from "@/features/public/products/components/ProductVariantTable"

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

            <section className="mx-auto max-w-7xl px-6 py-16">

                {/* PRODUCT HERO */}
                <ProductHero product={product} />

                {/* MEDIA ROW */}
                <ProductMediaRow product={product} />

            </section>

            <section className="mx-auto max-w-7xl px-6 pb-24">

                <ProductVariantTable variants={variants} productSlug={product.slug} />

            </section>

        </main>
    )
}
