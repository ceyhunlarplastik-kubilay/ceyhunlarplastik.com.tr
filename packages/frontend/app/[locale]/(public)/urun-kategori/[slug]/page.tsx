import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategoryBySlug } from "@/features/public/categories/server/getCategoryBySlug";
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter";
import { getCategoryProducts } from "@/features/public/products/server/getCategoryProducts";
import { slimCategoryFilterAttributes } from "@/features/public/productAttributes/utils/slimCategoryFilterAttributes";
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
        getCategoryBySlug(slug, locale),
    ])

    if (!category) return {}

    const trSlug = category.alternateSlugs.tr ?? category.slug
    const enSlug = category.alternateSlugs.en
    const canonicalPath = locale === "tr"
        ? `/urun-kategori/${trSlug}`
        : `/en/urun-kategori/${enSlug ?? category.slug}`
    const languages = {
        tr: `/urun-kategori/${trSlug}`,
        "x-default": `/urun-kategori/${trSlug}`,
        ...(enSlug ? { en: `/en/urun-kategori/${enSlug}` } : {}),
    }

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
            languages,
        },
        ...(category.translationMissing && {
            robots: { index: false, follow: true },
        }),
    }
}

export default async function CategoryPage(
    { params }: PageProps
) {

    const { locale, slug } = await params
    setRequestLocale(locale)

    const [tb, category, attributes, initialProducts] = await Promise.all([
        getTranslations({ locale, namespace: "shared.breadcrumbs" }),
        getCategoryBySlug(slug, locale),
        getAttributesForFilter(locale),
        // Filtresiz ilk sayfa ürünleri; ProductFilterList'te initialData olur (client fetch'siz).
        getCategoryProducts(slug, locale),
    ])

    if (!category) notFound()

    if (category.slug !== slug) {
        permanentRedirect(
            locale === "tr"
                ? `/urun-kategori/${category.slug}`
                : `/en/urun-kategori/${category.slug}`,
        )
    }

    const tf = await getTranslations({ locale, namespace: "public.productFilter" })

    // KN-2: sidebar'a full attributes (1.28MB) yerine slim payload geç (translations atılır,
    // non-industrial value'lar kategorinin allowedValueIds'ine göre ön-filtrelenir).
    const filterAttributes = slimCategoryFilterAttributes(
        attributes,
        category.allowedAttributeValueIds,
    )

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
                    {/* KN-1: useSearchParams kullanan filtre bileşenleri Suspense'e sarılır;
                        aksi halde sayfa static'ten düşüyor (no-store) ve CDN'de cache'lenmiyordu. */}
                    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-neutral-100" />}>
                        <ProductFilterSidebar
                            categories={[category]}
                            attributes={filterAttributes}
                            hideCategoryFilter
                            fixedCategorySlug={category.slug}
                            basePath={`/urun-kategori/${category.slug}`}
                        />
                    </Suspense>
                </aside>

                <section className="col-span-9">
                    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-neutral-100" />}>
                        <ProductFilterList
                            fixedCategorySlug={category.slug}
                            basePath={`/urun-kategori/${category.slug}`}
                            initialProducts={initialProducts}
                        />
                    </Suspense>
                </section>
            </section>

        </main>
    )
}
