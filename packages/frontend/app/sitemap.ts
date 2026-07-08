import type { MetadataRoute } from "next";
import { siteUrl } from "./sharedMetadata";

/**
 * Statik public (pazarlama) sayfaları — TR canonical prefixsiz, EN /en altında.
 * Bilinçli hariç tutulanlar: /sepet (SEO değeri yok), auth ekranları, paneller.
 * TODO (i18n Faz 1c): dynamic girişler — /urun/[slug], /urun-kategori/[slug] —
 * DB'den slug listesiyle eklenecek.
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

export default function sitemap(): MetadataRoute.Sitemap {
    return staticPublicPaths.map((path) => ({
        url: `${siteUrl}${path || "/"}`,
        alternates: {
            languages: {
                tr: `${siteUrl}${path || "/"}`,
                en: `${siteUrl}/en${path}`,
            },
        },
    }));
}
