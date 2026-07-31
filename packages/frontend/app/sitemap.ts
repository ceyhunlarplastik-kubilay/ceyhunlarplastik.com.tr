import type { MetadataRoute } from "next";
import { getCategories } from "@/features/public/categories/server/getCategories";
import { getFilteredProducts } from "@/features/public/products/server/getFilteredProducts";
import type { Category } from "@/features/public/categories/types";
import type { Product } from "@/features/public/products/types";
import { routing } from "@/i18n/routing";
import { localePath } from "@/i18n/alternates";
import { siteUrl } from "./sharedMetadata";

/**
 * Statik public (pazarlama) sayfaları — varsayılan dil prefixsiz, diğerleri
 * /<locale> altında. Bilinçli hariç tutulanlar: /sepet (SEO değeri yok),
 * auth ekranları, paneller.
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

function absoluteUrl(locale: string, internalPath: string) {
    const path = localePath(locale, internalPath || "/");
    return `${siteUrl}${path === "/" ? "/" : path}`;
}

async function getSitemapProducts(locale: string) {
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

type SlugEntity = {
    id: string;
    slug: string;
    alternateSlugs?: Record<string, string>;
    translationMissing?: boolean;
};

/**
 * Slug taşıyan varlıklar (kategori / ürün) için hreflang kümesi üretir.
 *
 * Varsayılan dilin listesi omurgadır — bir varlık orada mutlaka vardır. Diğer
 * diller yalnız o dile GERÇEKTEN çevrilmişse (translationMissing false ve slug
 * var) hreflang'e ve sitemap'e girer; aksi hâlde o dilde yayınlanmamış sayılır.
 */
function buildSlugEntries(
    entitiesByLocale: Map<string, SlugEntity[]>,
    pathFor: (slug: string) => string,
): MetadataRoute.Sitemap {
    const spine = entitiesByLocale.get(routing.defaultLocale) ?? [];
    const byLocaleAndId = new Map<string, Map<string, SlugEntity>>();

    for (const [locale, entities] of entitiesByLocale) {
        byLocaleAndId.set(locale, new Map(entities.map((entity) => [entity.id, entity])));
    }

    const entries: MetadataRoute.Sitemap = [];

    for (const entity of spine) {
        const urlByLocale = new Map<string, string>();

        for (const locale of routing.locales) {
            const localized = byLocaleAndId.get(locale)?.get(entity.id);
            if (!localized) continue;

            const isDefault = locale === routing.defaultLocale;
            if (!isDefault && localized.translationMissing) continue;

            const slug = localized.alternateSlugs?.[locale] ?? (isDefault ? localized.slug : undefined);
            if (!slug) continue;

            urlByLocale.set(locale, absoluteUrl(locale, pathFor(slug)));
        }

        if (urlByLocale.size === 0) continue;

        const languages: Record<string, string> = Object.fromEntries(urlByLocale);
        const defaultUrl = urlByLocale.get(routing.defaultLocale);
        if (defaultUrl) languages["x-default"] = defaultUrl;

        for (const url of urlByLocale.values()) {
            entries.push({ url, alternates: { languages } });
        }
    }

    return entries;
}

/**
 * NOT: dil sayısı arttıkça bu sitemap hem üretim maliyeti (dil başına tam
 * katalog crawl'ı) hem de boyut açısından büyüyor. Google'ın tek sitemap için
 * 50.000 URL sınırına yaklaşıldığında sitemap index'e bölünmeli.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticEntries: MetadataRoute.Sitemap = staticPublicPaths.flatMap((path) => {
        const languages: Record<string, string> = {};
        for (const locale of routing.locales) {
            languages[locale] = absoluteUrl(locale, path);
        }
        languages["x-default"] = absoluteUrl(routing.defaultLocale, path);

        return routing.locales.map((locale) => ({
            url: absoluteUrl(locale, path),
            alternates: { languages },
        }));
    });

    const categoriesByLocale = new Map<string, Category[]>();
    const productsByLocale = new Map<string, Product[]>();

    await Promise.all(
        routing.locales.flatMap((locale) => [
            getCategories(locale).then((result) => {
                categoriesByLocale.set(locale, result);
            }),
            getSitemapProducts(locale).then((result) => {
                productsByLocale.set(locale, result);
            }),
        ]),
    );

    const categoryEntries = buildSlugEntries(
        categoriesByLocale as Map<string, SlugEntity[]>,
        (slug) => `/urun-kategori/${slug}`,
    );
    const productEntries = buildSlugEntries(
        productsByLocale as Map<string, SlugEntity[]>,
        (slug) => `/urun/${slug}`,
    );

    return [...staticEntries, ...categoryEntries, ...productEntries];
}
