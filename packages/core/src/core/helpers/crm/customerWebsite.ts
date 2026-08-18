/**
 * Firma web sitesi normalizasyonu — saf, bu yüzden testlenebilir.
 *
 * Kullanıcı "acme.com", "www.acme.com", "HTTP://Acme.com/" gibi biçimlerin
 * hepsini yazıyor. Ham metni saklamak tutarsız veri biriktirir (aynı site için
 * beş farklı kayıt), bu yüzden tek bir kanonik biçime indirilir.
 *
 * Kurallar:
 *  - Şema yoksa `https://` eklenir (varsayılan güvenli şema).
 *  - Yalnız `http`/`https` kabul edilir; `javascript:` gibi şemalar reddedilir
 *    (bu değer arayüzde link olarak render ediliyor).
 *  - Host küçük harfe indirilir, sondaki tek `/` atılır.
 *  - Yol/sorgu/parça korunur: bazı firmaların sitesi alt yolda olabiliyor.
 */

export class InvalidWebsiteUrlError extends Error {
    constructor(value: string) {
        super(`Geçersiz web sitesi adresi: ${value}`)
        this.name = "InvalidWebsiteUrlError"
    }
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"])

/**
 * Boş/whitespace girdide `null` döner (alan opsiyonel). Geçersiz adreste
 * `InvalidWebsiteUrlError` fırlatır — sessizce null'a düşürmek kullanıcının
 * yazdığı veriyi kaybetmek olurdu.
 */
export function normalizeWebsiteUrl(value: string | null | undefined): string | null {
    const trimmed = value?.trim()
    if (!trimmed) return null

    // Şema yoksa ekle; "//acme.com" gibi protokol-bağımsız biçimi de kapsar.
    const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
        ? trimmed
        : `https://${trimmed.replace(/^\/+/, "")}`

    let url: URL
    try {
        url = new URL(withProtocol)
    } catch {
        throw new InvalidWebsiteUrlError(trimmed)
    }

    if (!ALLOWED_PROTOCOLS.has(url.protocol)) throw new InvalidWebsiteUrlError(trimmed)
    // "https://" tek başına yazıldığında host boş kalır.
    if (!url.hostname) throw new InvalidWebsiteUrlError(trimmed)
    // En az bir nokta: "https://acme" gibi tek etiketli host kabul edilmez.
    if (!url.hostname.includes(".")) throw new InvalidWebsiteUrlError(trimmed)

    url.hostname = url.hostname.toLowerCase()
    url.protocol = url.protocol.toLowerCase()

    const normalized = url.toString()
    // Kök yolda sondaki "/" gürültü; alt yolda anlamlı olduğu için korunur.
    return url.pathname === "/" && !url.search && !url.hash
        ? normalized.replace(/\/$/, "")
        : normalized
}

/** Arayüzde gösterilecek kısa biçim: şema ve "www." atılır. */
export function formatWebsiteLabel(value: string | null | undefined): string | null {
    if (!value?.trim()) return null

    try {
        const url = new URL(value)
        const host = url.hostname.replace(/^www\./, "")
        const path = url.pathname === "/" ? "" : url.pathname
        return `${host}${path}${url.search}${url.hash}`
    } catch {
        return value.trim()
    }
}
