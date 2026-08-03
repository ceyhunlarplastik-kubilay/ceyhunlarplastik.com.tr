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

/** Boş / yalnız işaretten ibaret değerleri "" yapar, değilse öneki garanti eder. */
function normalizeFragment(value: string | undefined, prefix: "?" | "#"): string {
    const trimmed = value?.trim();
    if (!trimmed || trimmed === prefix) return "";
    return trimmed.startsWith(prefix) ? trimmed : `${prefix}${trimmed}`;
}

/**
 * Dil değiştirirken adres çubuğundaki sorguyu ve çapayı hedef yola taşır.
 *
 * hreflang etiketleri BİLEREK sorgusuz üretilir: canonical/alternate temiz URL
 * olmalı, yoksa her ölçü veya filtre kombinasyonu ayrı bir alternate gibi
 * görünür ve arama motoruna yanlış sinyal gider. Ama kullanıcı dil değiştirince
 * seçimini kaybetmemeli — `/urun/<slug>/varyantlar?m=…` sayfasında EN'e geçmek
 * seçili ölçüyü düşürüyor ve sayfa "hiç ölçü seçilmemiş" haline dönüyordu.
 *
 * Taşınan değerler dilden bağımsız (ölçü anahtarları ve filtreler UUID/kod
 * taşır), o yüzden hedef dilde de aynen geçerlidir. Hedef yolun kendi sorgusu
 * veya çapası varsa ona dokunulmaz: sunucunun yazdığı değer daha bilgilidir.
 */
export function withPreservedQuery(
    path: string,
    current: { search?: string; hash?: string },
): string {
    const hashIndex = path.indexOf("#");
    const hashFromPath = hashIndex === -1 ? "" : path.slice(hashIndex);
    const pathWithoutHash = hashIndex === -1 ? path : path.slice(0, hashIndex);

    const search = pathWithoutHash.includes("?")
        ? ""
        : normalizeFragment(current.search, "?");
    const hash = hashFromPath || normalizeFragment(current.hash, "#");

    return `${pathWithoutHash}${search}${hash}`;
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
