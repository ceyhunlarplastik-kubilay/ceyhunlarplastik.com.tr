import { Suspense } from "react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { getCategories } from "@/features/public/categories/server/getCategories"
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter"

import ProductFilterSidebar from "@/features/public/products/components/ProductFilterSidebar"
import ProductFilterList from "@/features/public/products/components/ProductFilterList"

import ProductGridSkeleton from "@/features/public/products/components/ProductGridSkeleton"

import { PageHero } from "@/components/sections/PageHero";

export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const { locale } = await params
    setRequestLocale(locale)

    const resolvedParams = await searchParams;
    const categorySlug = resolvedParams?.category;
    const [t, tb, categories, attributes] = await Promise.all([
        getTranslations({ locale, namespace: "public.productFilter" }),
        getTranslations({ locale, namespace: "shared.breadcrumbs" }),
        getCategories(locale),
        getAttributesForFilter(locale),
    ])

    let title = t("pageTitle");
    let breadcrumbs = [
        { label: tb("home"), href: "/" },
        { label: t("pageTitle") }
    ];

    if (categorySlug) {
        const selectedCategory = categories.find((c: any) => c.slug === categorySlug);
        if (selectedCategory) {
            title = t("filteringTitle", { name: selectedCategory.name });
            breadcrumbs = [
                { label: tb("home"), href: "/" },
                { label: t("productCategories"), href: "/urunler" },
                { label: selectedCategory.name, href: `/urun-kategori/${selectedCategory.slug}` },
                { label: t("filteringLabel") }
            ];
        }
    }

    return (
        <main>

            {/* HERO */}
            <PageHero
                title={title}
                breadcrumbs={breadcrumbs}
            />

            {/* FILTER + PRODUCTS — kategori sayfası ve müşteri paneliyle aynı yerleşim:
                sabit 320px filtre kolonu + esnek içerik, lg altında alt alta yığılır. */}
            <section className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">

                    {/* LEFT FILTER — Sektörel Ürünler: yalnız endüstriyel taksonomi */}
                    <aside className="min-w-0">
                        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-neutral-100" />}>
                            <ProductFilterSidebar
                                categories={categories}
                                attributes={attributes}
                                // Bu sayfanın işi sektör → üretim grubu → kullanım alanı
                                // seçimi. Kategori-kapsamlı ürün filtreleri ve kategori
                                // seçici burada gösterilmez; onlar kategori sayfasının işi.
                                hideCategoryFilter
                                showOnlyIndustrialFilters
                                showProductSearch
                                attributeSelectorVariant="popover"
                                basePath="/urunler/filtre"
                            />
                        </Suspense>
                    </aside>

                    {/* RIGHT PRODUCTS */}
                    <div className="min-w-0">
                        <Suspense fallback={<ProductGridSkeleton />}>
                            <ProductFilterList />
                        </Suspense>
                    </div>

                </div>
            </section>

        </main>
    )
}
