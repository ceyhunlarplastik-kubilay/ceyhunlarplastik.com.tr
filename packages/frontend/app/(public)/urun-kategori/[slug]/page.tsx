import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug } from "@/features/public/categories/server/getCategoryBySlug";
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter";
import { PageHero } from "@/components/sections/PageHero";
import ProductFilterSidebar from "@/features/public/products/components/ProductFilterSidebar";
import ProductFilterList from "@/features/public/products/components/ProductFilterList";

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

    const [category, attributes] = await Promise.all([
        getCategoryBySlug(slug),
        getAttributesForFilter(),
    ])

    if (!category) notFound()

    const allowedIds = new Set(category.allowedAttributeValueIds ?? [])
    const filteredAttributes = attributes
        .map((attribute) => {
            if (allowedIds.size === 0) return { ...attribute, values: [] }
            return {
                ...attribute,
                values: (attribute.values ?? []).filter((value) => {
                    if (allowedIds.has(value.id)) return true
                    if (value.parentValueId && allowedIds.has(value.parentValueId)) return true
                    return false
                }),
            }
        })
        .filter((attribute) => (attribute.values?.length ?? 0) > 0)

    return (
        <main>

            {/* HERO */}
            <PageHero
                title={category.name}
                breadcrumbs={[
                    { label: "Ana Sayfa", href: "/" },
                    { label: "Ürün Kategorileri", href: "/urunler" },
                    { label: category.name }
                ]}
            />

            <section className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-12 gap-8">
                <aside className="col-span-3">
                    <ProductFilterSidebar
                        categories={[]}
                        attributes={filteredAttributes}
                        hideCategoryFilter
                        fixedCategorySlug={category.slug}
                        basePath={`/urun-kategori/${category.slug}`}
                    />

                    {/* <div className="mt-4">
                        <Link
                            href={`/urunler/filtre?category=${category.slug}`}
                            className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                            style={{
                                background: "var(--color-brand)",
                                color: "var(--color-brand-foreground)",
                            }}
                        >
                            Gelişmiş Filtreye Git
                        </Link>
                    </div> */}
                </aside>

                <section className="col-span-9">
                    <ProductFilterList
                        fixedCategorySlug={category.slug}
                        basePath={`/urun-kategori/${category.slug}`}
                    />
                </section>
            </section>

        </main>
    )
}
