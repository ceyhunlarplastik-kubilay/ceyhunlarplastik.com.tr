import slugify from "slugify"

import type { SupportedLocale } from "./locales"

/**
 * Çeviri satırları için slug üretimi — üç normalizer'ın (ürün, kategori,
 * attribute) paylaştığı tek kaynak. Önceden üçünde birebir aynı `buildSlug`
 * kopyası vardı.
 *
 * NEDEN FALLBACK VAR: `slugify(..., { strict: true })` ASCII dışı yazı
 * sistemlerini tamamen eler. Ampirik olarak doğrulandı (slugify 1.6.9):
 *
 *   tr/en/de/fr/es/it/pt/pl  → çalışır
 *   ru  "Бакелитовые ручки"  → "bakelitovye-ruchki"   (charmap var)
 *   ar  "مقابض الباكليت"      → "mqabdh-albaklyt"      (charmap var)
 *   ko  "베이클라이트 핸들"     → ""                     ← boş
 *   ja  "ベークライトハンドル"  → ""                     ← boş
 *   zh  "电木手柄"            → ""                     ← boş
 *   hi  "बैकेलाइट हैंडल"       → ""                     ← boş
 *
 * Daha kötüsü: içinde Latin/rakam parçası olan adlar yalnız o parçaya
 * çöker ("핸들 M8" → "m8"), ki bu `@@unique([locale, slug])` altında
 * çakışma mıknatısıdır.
 *
 * Bu yüzden slug türetilemediğinde VARSAYILAN DİLİN slug'ına düşülür.
 * Unique kısıt locale başına olduğu için aynı slug'ın başka bir dilin
 * satırında tekrarı çakışma yaratmaz, ve repository zaten
 * istenen-locale → varsayılan → legacy sırasıyla çözümleme yapıyor.
 */
function rawSlugify(value: string, locale: SupportedLocale): string {
    return slugify(value, {
        lower: true,
        strict: true,
        locale,
    })
}

const ASCII_ALNUM = /[A-Za-z0-9]/
const LETTER_OR_NUMBER = /[\p{L}\p{N}]/u

/**
 * Ad'dan türetilen slug "yozlaşmış" mı? Yani slugify adın Latin olmayan
 * kısmını tamamen eliyor mu?
 *
 * Locale listesi (ko/ja/zh/hi) HARDCODE EDİLMEDİ; yazı sistemi ampirik olarak
 * sınanır — yeni bir dil eklendiğinde slugify'ın o yazı sistemi için charmap'i
 * varsa kendiliğinden doğru davranır, yoksa kendiliğinden fallback'e düşer.
 *
 * Örnekler:
 *   "PVC 모서리 세척기" → Latin dışı "모서리 세척기" → ""  → YOZLAŞMIŞ (slug "pvc" olurdu)
 *   "Бакелитовые ручки" → Latin dışı = tümü → "bakelitovye-ruchki" → sağlam
 *   "Çark Tipi"        → Latin dışı "Ç" → "c" → sağlam
 *   "USB Type-C"       → Latin dışı yok → sağlam (ad zaten Latin)
 */
function isNameDerivedSlugDegenerate(value: string, locale: SupportedLocale): boolean {
    // Yalnız HARF/RAKAM artığına bakılır. Noktalama/boşluk elenmezse
    // "Bakelit-Griffe" gibi saf Latin adlarda geriye "-" kalır, slugify onu da
    // eler ve ad yanlışlıkla yozlaşmış sayılırdı (testte yakalandı).
    const nonLatinScript = Array.from(value)
        .filter((ch) => LETTER_OR_NUMBER.test(ch) && !ASCII_ALNUM.test(ch))
        .join("")

    if (!nonLatinScript) return false

    return rawSlugify(nonLatinScript, locale) === ""
}

export function buildTranslationSlug(
    value: string,
    locale: SupportedLocale,
    options: { derivedFromName?: boolean } = {},
): string {
    // Yalnız ADDAN türetirken yozlaşma kontrolü yapılır. Admin'in AÇIKÇA girdiği
    // slug asla sessizce atılmaz — o bilinçli bir tercihtir.
    if (options.derivedFromName && isNameDerivedSlugDegenerate(value, locale)) {
        return ""
    }

    return rawSlugify(value, locale)
}

/**
 * Çeviri adı için asgari uzunluk. 2 olamaz: `赤` (kırmızı), `青` gibi tek
 * karakterli CJK adları geçerlidir ve eski taban onları reddediyordu.
 * Unicode kod noktası sayılır — `Array.from` sürrogat çiftlerini bölmez.
 */
export const TRANSLATION_NAME_MIN_LENGTH = 1

export function isTranslationNameTooShort(name: string) {
    return Array.from(name.trim()).length < TRANSLATION_NAME_MIN_LENGTH
}
