import { routing } from "./routing";

type Messages = Record<string, unknown>;

function isPlainObject(value: unknown): value is Messages {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Derin merge — override kazanır.
 *
 * Diziler ELEMAN BAZINDA birleştirilmez, bütün olarak override edilir:
 * kataloglardaki diziler sıralı içerik listeleri (ör. `home.hero.words`,
 * `home.services.cards`) ve yarı-çevrilmiş bir dizi anlamsız olur.
 */
function mergeMessages(base: Messages, override: Messages): Messages {
    const result: Messages = { ...base };

    for (const [key, value] of Object.entries(override)) {
        const existing = result[key];
        result[key] =
            isPlainObject(existing) && isPlainObject(value)
                ? mergeMessages(existing, value)
                : value;
    }

    return result;
}

async function importCatalog(locale: string): Promise<Messages | null> {
    try {
        return (await import(`../messages/${locale}.json`)).default as Messages;
    } catch {
        // Katalog henüz üretilmemiş olabilir; zincirdeki diğer diller devreye girer.
        return null;
    }
}

/**
 * Bir dilin mesajlarını fallback zinciriyle yükler: **varsayılan dil → en → istenen dil**
 * (sonraki öncekini ezer).
 *
 * NEDEN: 14 dilde 847 anahtarın tamamının her dilde hazır olmasını beklemek
 * dil açmayı tümüyle bloke ederdi. Zincir sayesinde katalog KISMİ olabilir —
 * eksik anahtar runtime hatası vermek yerine İngilizce'ye, o da yoksa
 * Türkçe'ye düşer. Böylece bir dil, çevirisi ilerledikçe kademeli açılabilir.
 */
export async function loadMessages(locale: string): Promise<Messages> {
    let messages: Messages = {};

    for (const candidate of buildFallbackChain(locale)) {
        const catalog = await importCatalog(candidate);
        if (catalog) messages = mergeMessages(messages, catalog);
    }

    return messages;
}

/**
 * Zincirdeki SON dil kazanır, dolayısıyla istenen dil en sonda olmak ZORUNDA.
 *
 * Tekrarlar ilk görülene göre elenirse istenen dil zincirden düşer ve bir
 * ÖNCEKİ yedek onu ezer: `tr` istendiğinde zincir `["tr","en","tr"]` olur,
 * sondaki `tr` "zaten var" diye atılırsa geriye `["tr","en"]` kalır ve site
 * Türkçe seçiliyken İngilizce render edilir. Bu yüzden tekrarlar SON görülene
 * göre elenir.
 *
 * Varsayılan dil istendiğinde zincir tek elemanlıdır: o katalog referanstır ve
 * tanım gereği eksiksizdir, üzerine bir şey bindirmenin anlamı yok.
 */
function buildFallbackChain(locale: string): string[] {
    const defaultLocale = routing.defaultLocale as string;

    if (locale === defaultLocale) return [defaultLocale];

    return [defaultLocale, "en", locale].filter(
        (candidate, index, all) => all.lastIndexOf(candidate) === index,
    );
}

export const __testing = { mergeMessages, buildFallbackChain };
