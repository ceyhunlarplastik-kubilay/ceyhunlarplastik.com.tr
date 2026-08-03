/**
 * Sayfanın `<link rel="alternate" hreflang="…">` etiketlerinden dil değiştirici
 * için hedef yol çözümü.
 *
 * NEDEN BU KAYNAK: slug'ı dile göre değişen rotalarda (ürün, kategori) doğru
 * hedef yalnız sunucuda bilinir. `generateMetadata` bunu zaten her sayfa için
 * `buildAlternates` ile hesaplayıp head'e yazıyor — dil değiştirici aynı bilgiyi
 * ikinci kez ağdan çekmek yerine oradan okur.
 *
 * Alternatifi rota başına özel durum yazmaktı: kategori için bir fetch, ürün için
 * bir fetch, varyantlar için bir tane daha… Her yeni slug'lı rota listeye bir
 * madde ekliyordu ve unutulan rota, dil değiştirince yanlış slug'a gidiyordu.
 */

export type AlternateLink = {
    hreflang: string | null;
    href: string | null;
};

/**
 * Verilen dil için hedef yolu döndürür; yoksa `null`.
 *
 * Mutlak URL de gelebilir (tarayıcı `link.href`'i çözer), o yüzden yalnız yol
 * kısmı alınır — origin'i taşımak aynı sayfaya tam sayfa yükleme yaptırırdı.
 */
export function resolveAlternatePath(
    links: AlternateLink[],
    locale: string,
): string | null {
    for (const link of links) {
        if (link.hreflang !== locale) continue;

        const href = link.href?.trim();
        if (!href) continue;

        // Mutlak URL: yalnız yol + query + hash.
        const absolute = /^[a-z][a-z0-9+.-]*:\/\//i.exec(href);
        if (absolute) {
            try {
                const url = new URL(href);
                return `${url.pathname}${url.search}${url.hash}`;
            } catch {
                return null;
            }
        }

        return href.startsWith("/") ? href : `/${href}`;
    }

    return null;
}

/** Belgedeki hreflang bağlantılarını okur. Tarayıcı dışında boş dizi döner. */
export function readAlternateLinks(): AlternateLink[] {
    if (typeof document === "undefined") return [];

    return Array.from(
        document.querySelectorAll('link[rel="alternate"][hreflang]'),
    ).map((element) => ({
        hreflang: element.getAttribute("hreflang"),
        href: element.getAttribute("href"),
    }));
}
