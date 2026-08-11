import { DEFAULT_LOCALE, type SupportedLocale } from "@/core/i18n/locales"

/**
 * Ürün adları formüllüdür — çeviri için DeepL'e gönderilmez, ZATEN ÇEVRİLMİŞ
 * parçalardan yeniden BESTELENİR.
 *
 *   "11 Serisi Burç Bağlantılı Elcik Tipi Bakalit Tutamaklar"
 *    ─┬  ──┬──  ───────┬───────  ─────┬────  ────────┬───────
 *   sayı  seri   connection_type  model_type      kategori
 *
 * en → "11 Series Bushed Connector Knob Handles Bakelite Handles"
 *
 * NEDEN BESTELEME, ÇEVİRİ DEĞİL: (1) attribute değerleri ve kategori adları 14
 * dilde zaten çevrili — aynı metni ürün ürün yeniden çevirmek hem kotayı yakar
 * hem de aynı terimin ürünler arasında farklı çevrilmesine yol açar;
 * (2) besteleme terminolojiyi kendiliğinden tutarlı tutar; (3) bir attribute
 * çevirisi düzeltildiğinde onu kullanan BÜTÜN ürün adları tek hamlede düzelir.
 *
 * Sayı ve seri kelimesi her kategoride aynı; değişen kısım ortadaki attribute
 * sırası ve kategori adının sonda olup olmadığıdır. Bu tablo ürün sahibi
 * tarafından kategori kategori verilmiştir — tahmin edilmez.
 */

export type ProductNameSlot =
    | { kind: "number" }
    | { kind: "series" }
    | { kind: "category" }
    | {
        kind: "attribute"
        code: string
        /**
         * Değerdeki, kategori adında da geçen kelimeleri at. Kategori 10'da
         * `profile_type` = "Kutu Profil" ve kategori = "Profil Tapaları" →
         * atılmazsa ad "... Kutu Profil Profil Tapaları" olurdu.
         */
        dropWordsSharedWithCategory?: boolean
    }

export type ProductNameTemplate = ProductNameSlot[]

/**
 * "Serisi" kelimesinin dil karşılıkları. Sayıyla birlikte HER ZAMAN başta durur
 * ve slot sırası bütün dillerde sabittir (ürün sahibinin kararı: katalog
 * tutarlılığı, dil başına doğal sözdiziminden önce gelir).
 */
export const SERIES_WORD_BY_LOCALE: Record<SupportedLocale, string> = {
    tr: "Serisi",
    en: "Series",
    de: "Serie",
    fr: "Série",
    es: "Serie",
    it: "Serie",
    pt: "Série",
    pl: "Seria",
    ru: "Серия",
    ar: "سلسلة",
    ko: "시리즈",
    ja: "シリーズ",
    zh: "系列",
    hi: "सीरीज़",
}

const NUMBER: ProductNameSlot = { kind: "number" }
const SERIES: ProductNameSlot = { kind: "series" }
const CATEGORY: ProductNameSlot = { kind: "category" }
const attr = (code: string, dropWordsSharedWithCategory = false): ProductNameSlot => ({
    kind: "attribute",
    code,
    ...(dropWordsSharedWithCategory ? { dropWordsSharedWithCategory } : {}),
})

/**
 * `Category.code` → ad şablonu. Kaynak: ürün sahibinin kategori kategori verdiği
 * tablo (2026-08-10).
 *
 * Kategori adının SONDA OLMADIĞI kategoriler: 7, 9, 13, 21, 30 — bu kategorilerde
 * ürün adı zaten kategoriyi ima eden bir attribute değeriyle bitiyor.
 */
export const CATEGORY_NAME_TEMPLATES: Record<number, ProductNameTemplate> = {
    // Bakalit Tutamaklar
    1: [NUMBER, SERIES, attr("connection_type"), attr("model_type"), CATEGORY],
    // Metal Tutamaklar
    2: [NUMBER, SERIES, attr("connection_type"), attr("model_type"), CATEGORY],
    // Plastik Tutamaklar
    3: [NUMBER, SERIES, attr("connection_type"), attr("model_type"), CATEGORY],
    // Panel Çit Aksesuarları
    4: [NUMBER, SERIES, attr("material_type"), attr("model_type"), CATEGORY],
    // Titreşim Önleyiciler
    5: [NUMBER, SERIES, attr("connection_type"), attr("model_type"), CATEGORY],
    // Rotil Sistemleri ve Ayarlı Ayaklar — kategori adı sonda YOK
    7: [NUMBER, SERIES, attr("connection_type"), attr("profile_type"), attr("model_type")],
    // Demonte Ürün Çözümleri
    8: [NUMBER, SERIES, attr("connection_type"), attr("profile_type"), CATEGORY],
    // Cıvatalı Ayaklar — kategori adı sonda YOK
    9: [NUMBER, SERIES, attr("model_type"), attr("connection_type")],
    // Profil Tapaları — profile_type'daki "Profil" kelimesi kategoriyle çakışıyor
    10: [NUMBER, SERIES, attr("usage_type"), attr("hat_type"), attr("profile_type", true), CATEGORY],
    // Mobilya Ayakları
    12: [NUMBER, SERIES, attr("connection_type"), attr("material_type"), CATEGORY],
    // Mobilya Bağlantı Sistemleri — kategori adı sonda YOK
    13: [NUMBER, SERIES, attr("model_type")],
    // Sandalye Bileşenleri ve Okul Sıra Ekipmanları
    16: [NUMBER, SERIES, attr("model_type"), CATEGORY],
    // Kamp Mobilyası (Outdoor) Aksesuarları — attribute yok
    17: [NUMBER, SERIES, CATEGORY],
    // Medikal Aksesuarları
    18: [NUMBER, SERIES, attr("model_type"), CATEGORY],
    // Makine Ekipmanları
    19: [NUMBER, SERIES, attr("model_type"), CATEGORY],
    // Bahçe Mobilyası Aksesuarları — kategori adı sonda YOK
    21: [NUMBER, SERIES, attr("connection_type"), attr("model_type")],
    // Cıvata ve Somunlar — attribute sırası ürün sahibi tarafından HENÜZ VERİLMEDİ;
    // şimdilik yalnız sayı + seri + kategori. Eksik attribute eklenince güncellenmeli.
    22: [NUMBER, SERIES, CATEGORY],
    // Muhtelif Plastikler — kategori adı sonda YOK
    30: [NUMBER, SERIES, attr("model_type")],
}

/**
 * Şablonu OLMAYAN kategoriler burada bilinçli olarak boş: adları formülle
 * kurulamaz, DeepL yoluna düşerler.
 *   11 (Ruletler ve Tekerlekler) — hiç ürünü yok, formüle ihtiyaç duymuyor.
 *   14 (Kulplar ve Düğmeler)     — 4 ürün; formül henüz verilmedi.
 */
export const CATEGORY_CODES_WITHOUT_TEMPLATE = [11, 14] as const

/** "11 Serisi ..." ve "9.1 Serisi ..." — seri numarası olduğu gibi korunur. */
const LEADING_NUMBER = /^([\d.]+)\s+(\S+)\s+/

/**
 * Karşılaştırma normalizasyonu. Ürün adlarıyla attribute değerleri arasında
 * GERÇEK yazım tutarsızlıkları var (ölçüldü: `Elçik`/`Elcik`, `Cıvata`/`Civata`).
 * Ürün sahibine göre DOĞRU olan attribute değeridir, ad yanlış yazılmıştır.
 */
export function normalizeForMatch(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/ı/g, "i")
        .replace(/İ/g, "i")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLocaleLowerCase("en-US")
}

/**
 * Değerden, kategori adında da geçen kelimeleri atar.
 *
 * Dilden bağımsız çalışır: tr "Kutu Profil" + "Profil Tapaları" → "Kutu";
 * en "Box Profile" + "Profile Plugs" → "Box". Almanca gibi bileşik kelime kuran
 * dillerde ortak kelime bulunamaz ("Box-Profil" ↔ "Profilstopfen") ve değer
 * OLDUĞU GİBİ kalır — sessizce yanlış bir şey yapmaktansa dokunmamak yeğdir.
 * Her kelime elenirse de orijinal değer korunur.
 */
export function dropWordsSharedWithCategory(value: string, categoryName: string): string {
    const categoryWords = new Set(normalizeForMatch(categoryName).split(" ").filter(Boolean))
    if (categoryWords.size === 0) return value

    const kept = value
        .split(/\s+/)
        .filter((word) => {
            const normalized = normalizeForMatch(word)
            return normalized.length > 0 && !categoryWords.has(normalized)
        })

    return kept.length > 0 ? kept.join(" ") : value
}

export type ProductNameParts = {
    /** Ürünün attribute kodları → o dildeki değer adı. */
    attributeValues: Record<string, string | undefined>
    categoryName: string
}

export function resolveTemplate(categoryCode: number | null | undefined) {
    if (categoryCode === null || categoryCode === undefined) return null
    return CATEGORY_NAME_TEMPLATES[categoryCode] ?? null
}

export function serializeTemplate(template: ProductNameTemplate): string {
    return template
        .map((slot) => (slot.kind === "attribute" ? `attr:${slot.code}` : slot.kind))
        .join(" + ")
}

export type ComposeResult =
    | { ok: true; name: string }
    | { ok: false; reason: "no-leading-number" | "missing-attribute"; missing?: string[] }

/** Şablonu HEDEF DİLDE besteler. Sayı kaynak addan olduğu gibi alınır. */
export function composeProductName(input: {
    template: ProductNameTemplate
    sourceName: string
    locale: SupportedLocale
    parts: ProductNameParts
}): ComposeResult {
    const match = LEADING_NUMBER.exec(input.sourceName)
    if (!match) return { ok: false, reason: "no-leading-number" }

    const missing: string[] = []
    const pieces: string[] = []

    for (const slot of input.template) {
        switch (slot.kind) {
            case "number":
                pieces.push(match[1])
                break
            case "series":
                pieces.push(SERIES_WORD_BY_LOCALE[input.locale])
                break
            case "category":
                if (!input.parts.categoryName) missing.push("category")
                else pieces.push(input.parts.categoryName)
                break
            case "attribute": {
                const value = input.parts.attributeValues[slot.code]
                if (!value) {
                    missing.push(slot.code)
                    break
                }
                pieces.push(slot.dropWordsSharedWithCategory
                    ? dropWordsSharedWithCategory(value, input.parts.categoryName)
                    : value)
                break
            }
        }
    }

    if (missing.length > 0) return { ok: false, reason: "missing-attribute", missing }

    return { ok: true, name: pieces.join(" ") }
}

/**
 * Kaynak dilde geri besteleyip saklı adla karşılaştırır. Fark ÇEVİRİYİ ENGELLEMEZ
 * — ürün sahibine göre doğru olan attribute değeridir — ama veri kalitesi raporu
 * olarak yüzeye çıkarılır.
 */
export function checkSourceRoundTrip(input: {
    template: ProductNameTemplate
    sourceName: string
    parts: ProductNameParts
}): { matches: boolean; composed: string | null } {
    const result = composeProductName({
        template: input.template,
        sourceName: input.sourceName,
        locale: DEFAULT_LOCALE,
        parts: input.parts,
    })

    if (!result.ok) return { matches: false, composed: null }

    return {
        matches: normalizeForMatch(result.name) === normalizeForMatch(input.sourceName),
        composed: result.name,
    }
}
