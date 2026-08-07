"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

import { PageHero } from "@/components/sections/PageHero"

export type ProductFilterHeroCategory = {
    slug: string
    name: string
}

/**
 * `/urunler/filtre` başlığı + breadcrumb'ı — `?category=` parametresini CLIENT'ta okur.
 *
 * NEDEN CLIENT: Bu tek satır (`searchParams.category`) sunucuda okunduğu sürece Next
 * route'un tamamını dynamic'e düşürüyordu → CDN'de hazır kopya tutulmuyor, her ziyaret
 * Lambda'da sıfırdan render ediliyordu (ölçüm: TTFB 0.26-0.37 s; ISR'li sayfalarda
 * 0.068 s). Sayfanın geri kalanı (filtreler, ürün listesi, arama) zaten client'ta
 * çalışıyordu; CDN kazancını yalnız bu başlık engelliyordu.
 *
 * ⚠️ Bu bileşen ÇAĞRILDIĞI YERDE `<Suspense>` ile sarılmalıdır. `useSearchParams`
 * Suspense'siz kullanılırsa bailout TÜM route'u yine dynamic yapar ve
 * `export const revalidate` sessizce yok sayılır (bkz. page-performance skill / P7).
 * Fallback jenerik başlığı çizer, yani statik HTML'de de dolu bir hero bulunur.
 *
 * Not: Link önizlemeleri (og:title) `generateMetadata`'nın işidir, buranın değil.
 */
export function ProductFilterPageHero({
    categories,
}: {
    categories: ProductFilterHeroCategory[]
}) {
    const t = useTranslations("public.productFilter")
    const tb = useTranslations("shared.breadcrumbs")
    const categorySlug = useSearchParams().get("category")

    const { title, breadcrumbs } = useMemo(() => {
        const selectedCategory = categorySlug
            ? categories.find((category) => category.slug === categorySlug)
            : undefined

        if (!selectedCategory) {
            return {
                title: t("pageTitle"),
                breadcrumbs: [{ label: tb("home"), href: "/" }, { label: t("pageTitle") }],
            }
        }

        return {
            title: t("filteringTitle", { name: selectedCategory.name }),
            breadcrumbs: [
                { label: tb("home"), href: "/" },
                { label: t("productCategories"), href: "/urunler" },
                { label: selectedCategory.name, href: `/urun-kategori/${selectedCategory.slug}` },
                { label: t("filteringLabel") },
            ],
        }
    }, [categories, categorySlug, t, tb])

    return <PageHero title={title} breadcrumbs={breadcrumbs} />
}
