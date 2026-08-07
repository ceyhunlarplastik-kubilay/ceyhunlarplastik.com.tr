import { Suspense } from "react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { getCategories } from "@/features/public/categories/server/getCategories"

import ProductFilterSidebar from "@/features/public/products/components/ProductFilterSidebar"
import ProductFilterList from "@/features/public/products/components/ProductFilterList"

import ProductGridSkeleton from "@/features/public/products/components/ProductGridSkeleton"

import { PageHero } from "@/components/sections/PageHero";
import { ProductFilterPageHero } from "@/features/public/products/components/ProductFilterPageHero";

// searchParams KULLANILMAZ — okunduğu anda route dynamic'e düşer, CDN'de hazır kopya
// tutulmaz ve her ziyaret Lambda'da sıfırdan render edilir (ölçüm: TTFB 0.26-0.37 s'e
// karşı ISR'de 0.068 s). `?category=` artık ProductFilterPageHero içinde CLIENT'ta
// okunuyor; sayfanın geri kalanı (filtre, arama, ürün listesi) zaten client'taydı.
export const revalidate = 60;

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    setRequestLocale(locale)

    // NOT: attributes BİLEREK çekilmiyor. `showOnlyIndustrialFilters` +
    // `lazyIndustrialAttributes` birlikte verildiğinde ProductFilterSidebar bu prop'u
    // hiç okumuyor (non-industrial dal erken `return []` ediyor, industrial dal lazy
    // veriden besleniyor) → hem 737 KB'lık cache okuması hem de aynı verinin RSC flight
    // payload'una serialize olması ortadan kalkıyor.
    const [t, tb, categories] = await Promise.all([
        getTranslations({ locale, namespace: "public.productFilter" }),
        getTranslations({ locale, namespace: "shared.breadcrumbs" }),
        getCategories(locale),
    ])

    // Hero'ya yalnız slug+name geçilir; tam kategori nesnesi zaten sidebar için flight
    // payload'unda ve buraya ikinci kez konması gereksiz ağırlık olurdu.
    const heroCategories = categories.map((category) => ({
        slug: category.slug,
        name: category.name,
    }))

    return (
        <main>

            {/* HERO — `?category=` client'ta okunur. Suspense ŞART: `useSearchParams`
                Suspense'siz kullanılırsa bailout tüm route'u dynamic yapar ve yukarıdaki
                `revalidate` sessizce yok sayılır. Fallback jenerik başlığı çizer, yani
                statik HTML dolu bir hero ile gelir. */}
            <Suspense
                fallback={
                    <PageHero
                        title={t("pageTitle")}
                        breadcrumbs={[
                            { label: tb("home"), href: "/" },
                            { label: t("pageTitle") },
                        ]}
                    />
                }
            >
                <ProductFilterPageHero categories={heroCategories} />
            </Suspense>

            {/* FILTER + PRODUCTS — kategori sayfası ve müşteri paneliyle aynı yerleşim:
                sabit 320px filtre kolonu + esnek içerik, lg altında alt alta yığılır. */}
            <section className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">

                    {/* LEFT FILTER — Sektörel Ürünler: yalnız endüstriyel taksonomi */}
                    <aside className="min-w-0">
                        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-neutral-100" />}>
                            <ProductFilterSidebar
                                categories={categories}
                                attributes={[]}
                                lazyIndustrialAttributes
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
