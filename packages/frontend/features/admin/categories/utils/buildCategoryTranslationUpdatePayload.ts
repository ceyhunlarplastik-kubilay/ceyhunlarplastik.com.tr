import type { UpdateCategoryParams } from "../api/updateCategory"

type TranslationUpdatePayload = Pick<
    UpdateCategoryParams,
    "name" | "translations" | "removeTranslationLocales"
>

export function buildCategoryTranslationUpdatePayload({
    name,
    englishName,
    nameChanged,
    englishNameChanged,
    hasEnglishTranslation,
}: {
    name: string
    englishName: string
    nameChanged: boolean
    englishNameChanged: boolean
    hasEnglishTranslation: boolean
}): TranslationUpdatePayload {
    const payload: TranslationUpdatePayload = {}
    const normalizedEnglishName = englishName.trim()

    if (nameChanged) payload.name = name

    if (englishNameChanged && normalizedEnglishName) {
        payload.translations = [{ locale: "en", name: normalizedEnglishName }]
    } else if (englishNameChanged && hasEnglishTranslation) {
        payload.removeTranslationLocales = ["en"]
    }

    return payload
}
