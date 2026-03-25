import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCategoryBySlug } from "@/features/public/categories/server/getCategoryBySlug";
import { getProductsByCategory } from "@/features/public/products/server/getProductsByCategory";
import { PageHero } from "@/components/sections/PageHero";
import { ProductCard } from "@/components/navigation/ProductCard";

export const revalidate = 60; // ISR

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata(
    { params }: PageProps
): Promise<Metadata> {

    const { slug } = await params

    const category = await getCategoryBySlug(slug)

    if (!category) return {}

    return {
        title: `${category.name} | Ceyhunlar Plastik`,
        description: `${category.name} ürün grubunu inceleyin.`,
        openGraph: {
            title: category.name,
            description: `${category.name} ürün grubu`,
            type: "website",
            url: `https://ceyhunlarplastik.com.tr/urun-kategori/${category.slug}`,
        },
        alternates: {
            canonical: `https://ceyhunlarplastik.com.tr/urun-kategori/${category.slug}`,
        },
    }
}

export default async function CategoryPage(
    { params }: PageProps
) {

    const { slug } = await params

    const category = await getCategoryBySlug(slug)

    if (!category) notFound()

    const products = await getProductsByCategory(category.id)

    return (
        <main>

            {/* HERO */}
            <PageHero
                title={category.name}
                breadcrumbs={[
                    { label: "Ana Sayfa", href: "/" },
                    { label: "Ürünler", href: "/urunler" },
                    { label: category.name }
                ]}
            />

            <Link
                href={`/urunler/filtre?category=${category.slug}`}
                className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                style={{
                    background: "var(--color-brand)",
                    color: "var(--color-brand-foreground)",
                }}
            >
                Filtreleyerek İncele
            </Link>

            {/* CATEGORY PRODUCTS GRID */}
            <section className="mx-auto max-w-7xl px-6 py-20">

                {products.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-20 bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200">
                        <p className="text-lg font-medium text-neutral-900">Bu kategoriye ait ürün bulunamadı</p>
                        <p className="text-sm text-neutral-500 mt-2">Bu ürün grubuna ait içerikler yakında eklenecektir.</p>
                    </div>
                )}

                <ul
                    className="
                        grid gap-6
                        grid-cols-2
                        sm:grid-cols-3
                        md:grid-cols-4
                        lg:grid-cols-6
                    "
                >
                    {products.map((product: any) => {
                        // Resim Seçimi
                        const primaryAsset = product.assets?.find((a: any) => a.role === "PRIMARY");
                        const animatedAsset = product.assets?.find((a: any) => a.role === "ANIMATION");
                        const fallbackAsset = product.assets?.find((a: any) => a.type === "IMAGE");

                        const staticImg = primaryAsset?.url || fallbackAsset?.url || "/placeholder.webp";
                        const animImg = animatedAsset?.url;

                        return (
                            <li key={product.id}>
                                <ProductCard
                                    title={product.name}
                                    code={product.code}
                                    href={`/urun/${product.slug}`}
                                    imageStatic={staticImg}
                                    imageAnimated={animImg}
                                >
                                    {product.name}
                                </ProductCard>
                            </li>
                        )
                    })}
                </ul>

            </section>

        </main>
    )
}