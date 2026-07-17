import type { MetadataRoute } from "next";
import { getCategories } from "@/features/public/categories/server/getCategories";
import { siteUrl } from "./sharedMetadata";

/**
 * Statik public (pazarlama) sayfaları — TR canonical prefixsiz, EN /en altında.
 * Bilinçli hariç tutulanlar: /sepet (SEO değeri yok), auth ekranları, paneller.
 * Ürün girişleri ProductTranslation pilotundan sonra locale-aware olarak eklenecek.
 */
const staticPublicPaths = [
    "",
    "/hakkimizda",
    "/iletisim",
    "/urunler",
    "/kataloglar",
    "/ham-madde-sertifikalari",
    "/seri-uretim",
    "/talasli-imalat",
    "/3d-baski-ve-tarama",
    "/arge-ve-prototipleme",
    "/surdurulebilirlik",
    "/ik",
    "/oneri-sikayet",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticEntries: MetadataRoute.Sitemap = staticPublicPaths.map((path) => ({
        url: `${siteUrl}${path || "/"}`,
        alternates: {
            languages: {
                tr: `${siteUrl}${path || "/"}`,
                en: `${siteUrl}/en${path}`,
            },
        },
    }));

    const [turkishCategories, englishCategories] = await Promise.all([
        getCategories("tr"),
        getCategories("en"),
    ]);
    const englishCategoriesById = new Map(
        englishCategories.map((category) => [category.id, category]),
    );
    const categoryEntries: MetadataRoute.Sitemap = [];

    for (const category of turkishCategories) {
        const turkishSlug = category.alternateSlugs.tr ?? category.slug;
        const englishCategory = englishCategoriesById.get(category.id);
        const englishSlug = englishCategory?.translationMissing
            ? undefined
            : englishCategory?.alternateSlugs.en;
        const turkishUrl = `${siteUrl}/urun-kategori/${turkishSlug}`;
        const englishUrl = englishSlug
            ? `${siteUrl}/en/urun-kategori/${englishSlug}`
            : undefined;
        const languages = {
            tr: turkishUrl,
            "x-default": turkishUrl,
            ...(englishUrl ? { en: englishUrl } : {}),
        };

        categoryEntries.push({
            url: turkishUrl,
            alternates: { languages },
        });

        if (englishUrl) {
            categoryEntries.push({
                url: englishUrl,
                alternates: { languages },
            });
        }
    }

    return [...staticEntries, ...categoryEntries];
}
