import { z } from "zod"

import type { TargetLocale } from "@core/i18n/locales"
import { ADMIN_LOCALES, ADMIN_TARGET_LOCALES, type AdminLocale } from "./adminLocales"

/**
 * Yalnız `name` taşıyan sözlük çevirileri (Renk, Malzeme, Ölçü Tipi, Kategori,
 * Ürün Özelliği, Özellik Değeri) için ortak form katmanı.
 *
 * Ürünün çeviri yüzeyi ayrıdır (`name` + `slug` + `description`) ve kendi
 * şemasında kalır; ortaklaştırılan şey burada dil listesi ve payload mantığı.
 */

export const NAME_TRANSLATION_MAX_LENGTH = 100

export const nameTranslationFormSchema = z.object({
    locale: z.enum(ADMIN_LOCALES),
    name: z
        .string()
        .max(NAME_TRANSLATION_MAX_LENGTH, `En fazla ${NAME_TRANSLATION_MAX_LENGTH} karakter`)
        .optional(),
})

export type NameTranslationFormValues = z.infer<typeof nameTranslationFormSchema>

export type ExistingNameTranslation = {
    locale: string
    name?: string | null
}

/**
 * Form varsayılanlarını hedef dillerin SABİT sırasında kurar.
 *
 * Dizi her zaman her hedef dil için bir girdi taşır (boş olsalar bile):
 * `adminTranslationIndex` ile hesaplanan RHF yollarının doğru girdiye denk
 * gelmesi buna bağlı.
 */
export function buildNameTranslationDefaults(
    existing?: ExistingNameTranslation[],
): NameTranslationFormValues[] {
    return ADMIN_TARGET_LOCALES.map((locale) => ({
        locale,
        name: existing?.find((translation) => translation.locale === locale)?.name ?? "",
    }))
}

/** Dolu çeviri dilleri — dil seçicideki noktalı gösterge için. */
export function filledTranslationLocales(
    translations: NameTranslationFormValues[] | undefined,
): AdminLocale[] {
    return (translations ?? [])
        .filter((translation) => translation.name?.trim())
        .map((translation) => translation.locale)
}

export type NameTranslationsPayload = {
    translations?: Array<{ locale: AdminLocale; name: string }>
    removeTranslationLocales?: TargetLocale[]
}

/**
 * Form değerlerini API payload'una çevirir — SADECE değişenleri gönderir.
 *
 * Üç durum var ve üçü de gerçek bir hatayı kapatıyor:
 *  - ad girildi/değişti → `translations` (backend upsert eder; eskiden hedef
 *    diller `connectOrCreate` ile yazıldığı için MEVCUT çeviri güncellenmiyordu)
 *  - ad silindi ve kayıtta vardı → `removeTranslationLocales` (eskiden Renk /
 *    Malzeme / Ölçü Tipi'nde bu hiç mümkün değildi)
 *  - değişmedi → hiç gönderilmez, o satıra dokunulmaz
 *
 * `existing` verilmezse (oluşturma akışı) yalnız dolu adlar gönderilir.
 */
export function buildNameTranslationsPayload({
    translations,
    existing,
}: {
    translations: NameTranslationFormValues[] | undefined
    existing?: ExistingNameTranslation[]
}): NameTranslationsPayload {
    const payload: NameTranslationsPayload = {}
    const upserts: Array<{ locale: AdminLocale; name: string }> = []
    const removals: TargetLocale[] = []

    for (const translation of translations ?? []) {
        // Varsayılan dil kaydın kendi `name` kolonunda yaşar; çeviri satırı olarak
        // gönderilmez, silinemez.
        if (!(ADMIN_TARGET_LOCALES as readonly string[]).includes(translation.locale)) continue

        const locale = translation.locale as TargetLocale
        const next = translation.name?.trim() ?? ""
        const previous =
            existing?.find((item) => item.locale === locale)?.name?.trim() ?? ""

        if (next === previous) continue

        if (next) upserts.push({ locale, name: next })
        else if (previous) removals.push(locale)
    }

    if (upserts.length > 0) payload.translations = upserts
    if (removals.length > 0) payload.removeTranslationLocales = removals

    return payload
}
