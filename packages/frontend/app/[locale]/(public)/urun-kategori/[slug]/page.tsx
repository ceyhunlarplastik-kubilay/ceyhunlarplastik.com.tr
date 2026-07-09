import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategoryBySlug } from "@/features/public/categories/server/getCategoryBySlug";
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter";
import { PageHero } from "@/components/sections/PageHero";
import ProductFilterSidebar from "@/features/public/products/components/ProductFilterSidebar";
import ProductFilterList from "@/features/public/products/components/ProductFilterList";

export const revalidate = 60; // ISR

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata(
    { params }: PageProps
): Promise<Metadata> {

    const { locale, slug } = await params

    const [t, category] = await Promise.all([
        getTranslations({ locale, namespace: "public.productFilter" }),
        getCategoryBySlug(slug),
    ])

    if (!category) return {}

    const canonicalPath = locale === "tr" ? `/urun-kategori/${category.slug}` : `/en/urun-kategori/${category.slug}`

    return {
        // Root layout template "| Ceyhunlar Plastik" ekler
        title: category.name,
        description: t("categoryMetaDescription", { name: category.name }),
        openGraph: {
            title: category.name,
            description: t("categoryOgDescription", { name: category.name }),
            type: "website",
            locale: locale === "tr" ? "tr_TR" : "en_US",
        },
        alternates: {
            canonical: canonicalPath,
            languages: {
                tr: `/urun-kategori/${category.slug}`,
                en: `/en/urun-kategori/${category.slug}`,
                "x-default": `/urun-kategori/${category.slug}`,
            },
        },
    }
}

export default async function CategoryPage(
    { params }: PageProps
) {

    const { locale, slug } = await params
    setRequestLocale(locale)

    const [tb, category, attributes] = await Promise.all([
        getTranslations({ locale, namespace: "shared.breadcrumbs" }),
        getCategoryBySlug(slug),
        getAttributesForFilter(),
    ])

    if (!category) notFound()

    const tf = await getTranslations({ locale, namespace: "public.productFilter" })

    return (
        <main>

            {/* HERO */}
            <PageHero
                title={category.name}
                breadcrumbs={[
                    { label: tb("home"), href: "/" },
                    { label: tf("productCategories"), href: "/urunler" },
                    { label: category.name }
                ]}
            />

            <section className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-12 gap-8">
                <aside className="col-span-3">
                    <ProductFilterSidebar
                        categories={[category]}
                        attributes={attributes}
                        hideCategoryFilter
                        fixedCategorySlug={category.slug}
                        basePath={`/urun-kategori/${category.slug}`}
                    />
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
