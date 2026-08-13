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
import { getOgLocale } from "@/i18n/localeMetadata";
import { buildAlternates, localePath } from "@/i18n/alternates";

export const revalidate = 60; // ISR

/**
 * ISR'i AÇAR. Dinamik segmentli bir route `generateStaticParams` OLMADAN tamamen
 * dynamic render edilir ve `export const revalidate` sessizce etkisiz kalır —
 * prod'da ölçüldü: `cache-control: private, no-store`, `x-nextjs-prerender`
 * başlığı yok, her istek Lambda'ya gidiyordu (TTFB ~1.3 sn). Statik yollu
 * sayfalar (`/`, `/urunler/filtre`) aynı anda ISR çalışıyordu.
 *
 * Boş dizi + varsayılan `dynamicParams: true`: build'de hiçbir sayfa üretilmez
 * (850 ürün × 14 dil ~11.900 sayfa olurdu), ilk istek sayfayı üretir ve CDN'de
 * cache'lenir. Sonraki ziyaretçiler CDN hızında alır.
 */
export async function generateStaticParams() {
    return []
}

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

    const alternates = buildAlternates({
        locale,
        pathFor: (candidate) => {
            const localeSlug = category.alternateSlugs?.[candidate]
            if (!localeSlug) return null
            return `/urun-kategori/${localeSlug}`
        },
    })

    return {
        // Root layout template "| Ceyhunlar Plastik" ekler
        title: category.name,
        description: t("categoryMetaDescription", { name: category.name }),
        openGraph: {
            title: category.name,
            description: t("categoryOgDescription", { name: category.name }),
            type: "website",
            locale: getOgLocale(locale),
        },
        alternates,
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

    // Başka bir dilin slug'ıyla gelindiyse bu dilin kanonik slug'ına yönlendir.
    // Hedef `localePath` ile türetilir: eskiden "tr değilse /en" diye gömülüydü ve
    // Dalga 1 açıldığında Almanca ziyaretçiyi İNGİLİZCEYE sürüyordu — üstelik 301
    // olduğu için tarayıcıda kalıcı önbelleğe girerdi.
    if (category.slug !== slug) {
        permanentRedirect(localePath(locale, `/urun-kategori/${category.slug}`))
    }

    const tf = await getTranslations({ locale, namespace: "public.productFilter" })

    // KN-2: sidebar'a full attributes (1.28MB) yerine slim payload geç (translations atılır,
    // non-industrial value'lar kategorinin allowedValueIds'ine göre ön-filtrelenir).
    // excludeIndustrial: endüstriyel filtreler (920 değer ≈ 726KB, slim payload'un %98.8'i)
    // varsayılan kapalı popover'da duruyor → SSR'dan çıkarılıp client'ta lazy çekilir.
    const filterAttributes = slimCategoryFilterAttributes(
        attributes,
        category.allowedAttributeValueIds,
        { excludeIndustrial: true },
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

            {/* Layout: müşteri panelindeki (CustomerPortalAllProductsPageClient) yerleşimin
                aynısı — sabit 320px filtre kolonu + esnek içerik. Eski `grid-cols-12` +
                `col-span-3` responsive kırılım taşımadığı için sidebar mobilde %25'e
                sıkışıyordu; artık lg altında alt alta yığılır. */}
            <section className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
                    <aside className="min-w-0">
                        {/* KN-1: useSearchParams kullanan filtre bileşenleri Suspense'e sarılır;
                            aksi halde sayfa static'ten düşüyor (no-store) ve CDN'de cache'lenmiyordu. */}
                        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-neutral-100" />}>
                            <ProductFilterSidebar
                                categories={[category]}
                                attributes={filterAttributes}
                                hideCategoryFilter
                                lazyIndustrialAttributes
                                fixedCategorySlug={category.slug}
                                basePath={`/urun-kategori/${category.slug}`}
                                // Müşteri paneliyle aynı mantık: kategori sabit olduğu için
                                // ürün filtreleri gösterilir, endüstriyel taksonomi (sector/
                                // production_group/usage_area) gizlenir — o seçim
                                // /urunler/filtre sayfasının işi.
                                showSelectedCategoryPreview
                                showProductSearch
                                attributeSelectorVariant="popover"
                                showProductFiltersOnlyWhenCategorySelected
                                hideIndustrialFiltersWhenCategorySelected
                            />
                        </Suspense>
                    </aside>

                    <div className="min-w-0">
                        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-neutral-100" />}>
                            <ProductFilterList
                                fixedCategorySlug={category.slug}
                                basePath={`/urun-kategori/${category.slug}`}
                                initialProducts={initialProducts}
                            />
                        </Suspense>
                    </div>
                </div>
            </section>

        </main>
    )
}
