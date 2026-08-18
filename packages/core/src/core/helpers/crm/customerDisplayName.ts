/**
 * Müşterinin ekranda/mesajda gösterilecek adı.
 *
 * İki alan da opsiyonel: veri girişi panelinde FİRMA kaydedilir (yetkili adı
 * sonradan öğrenilebilir), public web formunda ise KİŞİ kendini kaydeder (firma
 * adı vermeyebilir). Bu yüzden "companyName || fullName" yazan her yer bir
 * fallback'e ihtiyaç duyuyor; kural burada tek yerde tutuluyor.
 *
 * Firma adında TEKİLLİK YOKTUR: Türkiye'de aynı unvanla birden çok firma
 * bulunabiliyor, ayrım vergi numarası/adres/konumdan yapılır.
 */

type CustomerNameLike = {
    companyName?: string | null
    fullName?: string | null
} | null | undefined

const DEFAULT_FALLBACK = "İsimsiz müşteri"

function normalize(value: string | null | undefined) {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
}

export function resolveCustomerDisplayName(
    customer: CustomerNameLike,
    fallback = DEFAULT_FALLBACK,
): string {
    return normalize(customer?.companyName) ?? normalize(customer?.fullName) ?? fallback
}

/**
 * Firma adı ile yetkili adını AYRI göstermek isteyen yüzeyler için: başlık ve
 * (varsa) alt satır. İkisi aynıysa alt satır boş döner ki tekrar görünmesin.
 */
export function resolveCustomerNameParts(
    customer: CustomerNameLike,
    fallback = DEFAULT_FALLBACK,
): { title: string; subtitle: string | null } {
    const company = normalize(customer?.companyName)
    const person = normalize(customer?.fullName)

    if (company && person) return { title: company, subtitle: person }
    if (company) return { title: company, subtitle: null }
    if (person) return { title: person, subtitle: null }

    return { title: fallback, subtitle: null }
}
