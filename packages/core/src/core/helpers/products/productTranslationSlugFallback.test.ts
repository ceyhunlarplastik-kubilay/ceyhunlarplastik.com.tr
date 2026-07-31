import { describe, expect, it } from "vitest"

import { normalizeProductTranslations } from "./productTranslations"
import { normalizeCategoryTranslations } from "../categories/categoryTranslations"
import { normalizeProductAttributeValueTranslations } from "../productAttributes/productAttributeTranslations"

/**
 * ko/ja/zh/hi'de `slugify(..., { strict: true })` boş string üretiyor.
 * Eskiden bu diller `slug could not be generated` ile REDDEDİLİYORDU, yani o
 * dillerde içerik hiç kaydedilemiyordu. Artık varsayılan dilin slug'ına düşülür.
 */
describe("ASCII dışı dillerde slug fallback'i", () => {
    it("ürün çevirisinde Korece slug'ı TR slug'ına düşürür", () => {
        const { translations } = normalizeProductTranslations({
            legacyName: "Bakalit Tutamak",
            legacySlug: "bakalit-tutamak",
            translations: [
                { locale: "ko", name: "베이클라이트 핸들" },
            ],
            requireTurkish: true,
        })

        const korean = translations.find((translation) => translation.locale === "ko")

        expect(korean).toBeDefined()
        expect(korean!.name).toBe("베이클라이트 핸들")
        expect(korean!.slug).toBe("bakalit-tutamak")
    })

    it("Latin dillerde kendi slug'ını korur", () => {
        const { translations } = normalizeProductTranslations({
            legacyName: "Bakalit Tutamak",
            legacySlug: "bakalit-tutamak",
            translations: [
                { locale: "de", name: "Bakelit Griff" },
            ],
            requireTurkish: true,
        })

        expect(translations.find((t) => t.locale === "de")!.slug).toBe("bakelit-griff")
    })

    it("kategori çevirisinde Japonca slug'ı TR slug'ına düşürür", () => {
        const { translations } = normalizeCategoryTranslations({
            legacyName: "Profil Tapaları",
            translations: [
                { locale: "ja", name: "プロファイルキャップ" },
            ],
            requireTurkish: true,
        })

        expect(translations.find((t) => t.locale === "ja")!.slug).toBe("profil-tapalari")
    })

    it("attribute değeri çevirisinde Çince slug'ı TR slug'ına düşürür", () => {
        const { translations } = normalizeProductAttributeValueTranslations({
            legacyName: "Kutu Profil",
            translations: [
                { locale: "zh", name: "方管" },
            ],
            requireTurkish: true,
        })

        expect(translations.find((t) => t.locale === "zh")!.slug).toBe("kutu-profil")
    })

    it("tek karakterli CJK adı artık reddedilmiyor", () => {
        const { translations } = normalizeCategoryTranslations({
            legacyName: "Kirmizi",
            translations: [{ locale: "zh", name: "赤" }],
            requireTurkish: true,
        })

        const chinese = translations.find((t) => t.locale === "zh")!

        expect(chinese.name).toBe("赤")
        expect(chinese.slug).toBe("kirmizi")
    })
})
