import type { SourceLanguageCode, TargetLanguageCode } from "deepl-node"

import type { SupportedLocale } from "./locales"

/**
 * Uygulama locale kodları ↔ DeepL dil kodları.
 *
 * AYRI MODÜL: hem `deeplTranslator` (istek atarken) hem `translationDraft`
 * (taslak başlığını doğrularken) buna ihtiyaç duyuyor. `deeplTranslator` zaten
 * `translationDraft`'tan `countUnicodeCharacters` alıyor; haritalar orada
 * kalsaydı iki modül birbirini import ederdi.
 */

export const SOURCE_LANGUAGE_BY_LOCALE: Record<SupportedLocale, SourceLanguageCode> = {
    tr: "tr",
    en: "en",
    de: "de",
    fr: "fr",
    es: "es",
    it: "it",
    pt: "pt",
    pl: "pl",
    ru: "ru",
    ar: "ar",
    ko: "ko",
    ja: "ja",
    zh: "zh",
    hi: "hi",
}

/**
 * Hedef tarafta DeepL bazı diller için BÖLGE İSTER; bölgesiz kod gönderilirse
 * uyarı üretir veya reddeder. Seçilen varyantlar:
 *  - en-GB (mevcut davranış korundu)
 *  - pt-BR (Brezilya pazarı; pt-PT'ye geçilecekse burası tek nokta)
 *  - zh-HANS (basitleştirilmiş; geleneksel için zh-HANT)
 *  - es (bölgesiz kabul ediliyor; Latin Amerika için es-419)
 */
export const TARGET_LANGUAGE_BY_LOCALE: Record<SupportedLocale, TargetLanguageCode> = {
    tr: "tr",
    en: "en-GB",
    de: "de",
    fr: "fr",
    es: "es",
    it: "it",
    pt: "pt-BR",
    pl: "pl",
    ru: "ru",
    ar: "ar",
    ko: "ko",
    ja: "ja",
    zh: "zh-HANS",
    hi: "hi",
}

export function getDeepLSourceLanguage(locale: SupportedLocale): SourceLanguageCode {
    return SOURCE_LANGUAGE_BY_LOCALE[locale]
}

export function getDeepLTargetLanguage(locale: SupportedLocale): TargetLanguageCode {
    return TARGET_LANGUAGE_BY_LOCALE[locale]
}

/**
 * DeepL glossary'leri dil çiftine bağlıdır ve glossary dil listesi çeviri dil
 * listesinden DAR. Hintçe glossary desteklenmiyor; glossaryId koşulsuz
 * gönderilirse DeepL isteği reddeder.
 * bkz. deepl-node `SourceGlossaryLanguageCode`
 */
const LOCALES_WITHOUT_GLOSSARY_SUPPORT = new Set<SupportedLocale>(["hi"])

export function supportsGlossary(locale: SupportedLocale) {
    return !LOCALES_WITHOUT_GLOSSARY_SUPPORT.has(locale)
}
