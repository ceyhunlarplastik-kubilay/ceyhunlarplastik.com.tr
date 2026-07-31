import { routing } from "./routing";

/**
 * `canonical` + `alternates.languages` üretimi.
 *
 * Önceden aynı iki-dil ternary'si 16 `generateMetadata` içinde ve `sitemap.ts`'de
 * kopyalanmıştı (`locale === "tr" ? "/x" : "/en/x"`). Dil sayısı arttıkça her
 * yeni dili 17 ayrı yerde elle eklemek gerekirdi; unutulan bir dosya o sayfada
 * eksik hreflang üretir ve arama motoruna yanlış sinyal verir.
 */

/** Locale-prefix'siz iç yolu, o dilin public URL'ine çevirir. TR prefixsizdir. */
export function localePath(locale: string, internalPath: string): string {
    const path = internalPath.startsWith("/") ? internalPath : `/${internalPath}`;
    return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

type BuildAlternatesArgs = {
    locale: string;
    /**
     * Bir dilin iç yolu. Slug taşıyan sayfalarda dile göre değişir; o dilde
     * karşılığı yoksa `null` dönerek hreflang'den düşürülür.
     */
    pathFor: (locale: string) => string | null | undefined;
};

export function buildAlternates({ locale, pathFor }: BuildAlternatesArgs) {
    const languages: Record<string, string> = {};

    for (const candidate of routing.locales) {
        const internalPath = pathFor(candidate);
        if (!internalPath) continue;

        languages[candidate] = localePath(candidate, internalPath);
    }

    // x-default varsayılan dili işaret eder; o dilde yol yoksa hiç yazılmaz.
    const defaultPath = pathFor(routing.defaultLocale);
    if (defaultPath) {
        languages["x-default"] = localePath(routing.defaultLocale, defaultPath);
    }

    // Aktif dilin kendi yolu yoksa (ör. o dile çevrilmemiş ürün) varsayılan
    // dilin yoluna düşülür; canonical'ın boş kalmaması gerekir.
    const currentPath = pathFor(locale) ?? defaultPath;

    return {
        canonical: currentPath ? localePath(locale, currentPath) : undefined,
        languages,
    };
}

/** Sabit yollu sayfalar için kısayol — yol her dilde aynıdır. */
export function buildStaticAlternates(locale: string, internalPath: string) {
    return buildAlternates({ locale, pathFor: () => internalPath });
}
