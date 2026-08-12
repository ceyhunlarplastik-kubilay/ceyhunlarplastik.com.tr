import { SUPPORTED_LOCALES, isSupportedLocale, type SupportedLocale } from "@core/i18n/locales"
import { ADMIN_LOCALE_LABELS } from "@/features/admin/shared/translations/adminLocales"

/**
 * Excel dosyasının SÖZLEŞMESİ — yazan ve okuyan taraf bu modülü paylaşır.
 * Satır/sütun numaraları burada tek yerde durduğu için formatı değiştirmek
 * ihracat ve ithalatı birlikte kaydırır; ikisinin ayrışması mümkün değil.
 *
 * Tek sayfa, diller YAN YANA sütun: çeviriyi yapan kişi kaynak Türkçe metni ile
 * hedef dili aynı satırda görür, sayfa değiştirmek zorunda kalmaz.
 *
 * Dosya kimliği SAYFA İÇİNDEKİ meta bloktan okunur, dosya adından DEĞİL:
 * kullanıcı dosyayı yeniden adlandırırsa doğrulama bozulmamalı. Dosya adı
 * yalnız insan içindir.
 */

export const USAGE_FUNCTION_MAX_LENGTH = 2000

export const SHEET_NAME = "Kullanım Fonksiyonları"

/** Meta blok: A sütunu etiket, B sütunu değer. */
export const META_LABEL_COLUMN = 1
export const META_VALUE_COLUMN = 2

export const META_ROWS = {
    title: 1,
    productId: 2,
    productCode: 3,
    productName: 4,
    exportedAt: 5,
    note: 6,
} as const

export const HEADER_ROW = 8
export const FIRST_DATA_ROW = 9

/** Sol blok: satırın kimliği ve bağlamı. Tamamı kilitlidir. */
export const COLUMNS = {
    order: 1,
    usageId: 2,
    sector: 3,
    productionGroup: 4,
    usageArea: 5,
} as const

/** Dil sütunları buradan başlar ve `SUPPORTED_LOCALES` sırasını izler. */
export const FIRST_LOCALE_COLUMN = 6

export const CONTEXT_COLUMN_WIDTHS = [6, 16, 24, 24, 30]
export const LOCALE_COLUMN_WIDTH = 52

export const META_LABELS = {
    title: "Kullanım Fonksiyonu Aktarım Dosyası",
    productId: "Ürün ID",
    productCode: "Ürün Kodu",
    productName: "Ürün Adı",
    exportedAt: "Dışa Aktarım",
} as const

export const SHEET_NOTE =
    "Yalnız dil sütunları doldurulabilir; boş bıraktığınız hücreler kayıtlı metni SİLMEZ. Ürün kimliği ve satır kimliği gizli tutulur, bağlam sütunları korumalıdır. Dosyayı Microsoft Excel veya LibreOffice Calc ile doldurun — Apple Numbers sayfa korumasını desteklemez."

export const COLUMN_HEADERS = {
    order: "#",
    usageId: "Kullanım Satırı ID",
    sector: "Sektör",
    productionGroup: "Üretim Grubu",
    usageArea: "Kullanım Alanı",
} as const

export function localeColumn(locale: SupportedLocale) {
    return FIRST_LOCALE_COLUMN + SUPPORTED_LOCALES.indexOf(locale)
}

export function lastColumn() {
    return FIRST_LOCALE_COLUMN + SUPPORTED_LOCALES.length - 1
}

/**
 * Sütun başlığı: "Türkçe (tr)". Etiket TÜRKÇE (panel TR-only, veri girişi yapan
 * kişi "Korece" arar), dil kodu parantez içinde — okuyucu dili başlıktan çözer.
 */
export function localeColumnHeader(locale: SupportedLocale) {
    return `${ADMIN_LOCALE_LABELS[locale]} (${locale})`
}

const LOCALE_CODE_IN_HEADER = /\(([A-Za-z]{2})\)\s*$/

/**
 * Sütunun dili BAŞLIKTAN okunur, konumdan değil: bir dil sütunu silinirse kalan
 * sütunlar kaymış konumlarıyla yanlış dile yazılmasın. Çözülemeyen başlık `null`
 * döner ve uyarı olarak raporlanır — sessiz tahmin yok.
 */
export function parseLocaleColumnHeader(value: unknown): SupportedLocale | null {
    if (typeof value !== "string") return null

    const match = LOCALE_CODE_IN_HEADER.exec(value.trim())
    if (!match) return null

    return parseLocaleCode(match[1])
}

export function parseLocaleCode(value: unknown): SupportedLocale | null {
    if (typeof value !== "string") return null
    const normalized = value.trim().toLowerCase()
    return isSupportedLocale(normalized) ? normalized : null
}

/** Dosya adında güvenli olsun diye: aksan sadeleştirme + tekil tire. */
export function slugifyForFileName(value: string) {
    const replacements: Record<string, string> = {
        ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
        ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
    }

    return value
        .replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => replacements[char] ?? char)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

/**
 * Anlamlı dosya adı: ne olduğu + hangi ürün + hangi tarih. Ürün ID'si tam
 * haliyle girer; kullanıcı dosyayı yanlış ürüne yüklerse hatayı meta blok
 * yakalar, ama ad da tek bakışta ayırt edilebilir olmalı.
 */
export function buildUsageFunctionFileName({
    productCode,
    productSlug,
    productId,
    exportedAt,
}: {
    productCode: string
    productSlug: string
    productId: string
    exportedAt: Date
}) {
    const datePart = exportedAt.toISOString().slice(0, 10)
    const codePart = slugifyForFileName(productCode) || "urun"
    const slugPart = slugifyForFileName(productSlug).slice(0, 48) || "model"

    return `kullanim-fonksiyonu_${codePart}_${slugPart}_${productId}_${datePart}.xlsx`
}

export function orderedLocales(): readonly SupportedLocale[] {
    return SUPPORTED_LOCALES
}
