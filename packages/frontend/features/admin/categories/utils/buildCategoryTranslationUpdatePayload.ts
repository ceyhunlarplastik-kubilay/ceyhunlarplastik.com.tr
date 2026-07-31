import {
    buildNameTranslationsPayload,
    type ExistingNameTranslation,
    type NameTranslationFormValues,
} from "@/features/admin/shared/translations/nameTranslations"

import type { UpdateCategoryParams } from "../api/updateCategory"

type TranslationUpdatePayload = Pick<
    UpdateCategoryParams,
    "name" | "translations" | "removeTranslationLocales"
>

/**
 * Kategori düzenleme formunun çeviri payload'u.
 *
 * Türkçe ad kategorinin kendi kolonu, diğer diller çeviri satırı — bu yüzden
 * `name` ayrı taşınır ve yalnız DEĞİŞMİŞSE gönderilir. Aynı dialog'da izinli
 * attribute değerleri için ayrı bir kaydet düğmesi var; ilgisiz alanları
 * göndermek onları da yeniden yazardı.
 *
 * Çok dilli diff (`translations` + `removeTranslationLocales`) paylaşılan
 * yardımcıdan gelir; burada yalnız kategoriye özgü `name` kuralı var.
 */
export function buildCategoryTranslationUpdatePayload({
    name,
    nameChanged,
    translations,
    existingTranslations,
}: {
    name: string
    nameChanged: boolean
    translations: NameTranslationFormValues[]
    existingTranslations?: ExistingNameTranslation[]
}): TranslationUpdatePayload {
    const payload: TranslationUpdatePayload = buildNameTranslationsPayload({
        translations,
        existing: existingTranslations,
    })

    if (nameChanged) payload.name = name

    return payload
}
