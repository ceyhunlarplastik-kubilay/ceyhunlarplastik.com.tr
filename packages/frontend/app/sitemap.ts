import type { MetadataRoute } from "next";
import { getCategories } from "@/features/public/categories/server/getCategories";
import { getFilteredProducts } from "@/features/public/products/server/getFilteredProducts";
import type { Product } from "@/features/public/products/types";
import { siteUrl } from "./sharedMetadata";

/**
 * Statik public (pazarlama) sayfaları — TR canonical prefixsiz, EN /en altında.
 * Bilinçli hariç tutulanlar: /sepet (SEO değeri yok), auth ekranları, paneller.
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

async function getSitemapProducts(locale: "tr" | "en") {
    const limit = 500;
    const products: Product[] = [];
    let page = 1;

    while (true) {
        const result = await getFilteredProducts({ locale, limit, page });
        products.push(...result.data);

        if (page >= result.meta.totalPages || result.data.length === 0) break;
        page += 1;
    }

    return products;
}

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

    const [turkishCategories, englishCategories, turkishProducts, englishProducts] = await Promise.all([
        getCategories("tr"),
        getCategories("en"),
        getSitemapProducts("tr"),
        getSitemapProducts("en"),
    ]);
    const englishCategoriesById = new Map(
        englishCategories.map((category) => [category.id, category]),
    );
    const categoryEntries: MetadataRoute.Sitemap = [];
    const englishProductsById = new Map(
        englishProducts.map((product) => [product.id, product]),
    );
    const productEntries: MetadataRoute.Sitemap = [];

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

    for (const product of turkishProducts) {
        const turkishSlug = product.alternateSlugs?.tr ?? product.slug;
        const englishProduct = englishProductsById.get(product.id);
        const englishSlug = englishProduct?.translationMissing
            ? undefined
            : englishProduct?.alternateSlugs?.en;
        const turkishUrl = `${siteUrl}/urun/${turkishSlug}`;
        const englishUrl = englishSlug
            ? `${siteUrl}/en/urun/${englishSlug}`
            : undefined;
        const languages = {
            tr: turkishUrl,
            "x-default": turkishUrl,
            ...(englishUrl ? { en: englishUrl } : {}),
        };

        productEntries.push({
            url: turkishUrl,
            alternates: { languages },
        });

        if (englishUrl) {
            productEntries.push({
                url: englishUrl,
                alternates: { languages },
            });
        }
    }

    return [...staticEntries, ...categoryEntries, ...productEntries];
}
