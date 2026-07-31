import { describe, expect, it } from "vitest"

import {
    PRODUCT_FORM_DEFAULT_LOCALE,
    PRODUCT_FORM_LOCALES,
    PRODUCT_FORM_TARGET_LOCALES,
    buildProductTranslationDefaults,
    isProductFormLocale,
    productTranslationIndex,
} from "./productFormSchema"

describe("locale seti", () => {
    it("varsayılan dil Türkçe ve hedef diller onu içermez", () => {
        expect(PRODUCT_FORM_DEFAULT_LOCALE).toBe("tr")
        expect(PRODUCT_FORM_TARGET_LOCALES).not.toContain(PRODUCT_FORM_DEFAULT_LOCALE)
        expect(PRODUCT_FORM_LOCALES[0]).toBe(PRODUCT_FORM_DEFAULT_LOCALE)
    })

    it("her hedef dilin sabit bir indeksi var", () => {
        // RHF yolları (`translations.<index>.name`) bu indekse dayanıyor;
        // sıra kayarsa alanlar yanlış dile yazılır.
        PRODUCT_FORM_TARGET_LOCALES.forEach((locale, index) => {
            expect(productTranslationIndex(locale)).toBe(index)
        })
    })

    it("desteklenmeyen locale kodunu ayırt eder", () => {
        // `de` artık DESTEKLENEN bir dil (14 dil setiyle geldi); bu testin eski
        // hâli onu "desteklenmiyor" sanıyordu. Gerçekten tanınmayan bir kodla
        // doğrulanıyor.
        expect(isProductFormLocale("tr")).toBe(true)
        expect(isProductFormLocale("de")).toBe(true)
        expect(isProductFormLocale("xx")).toBe(false)
        expect(isProductFormLocale("en-GB")).toBe(false)
    })
})

describe("buildProductTranslationDefaults", () => {
    it("her hedef dil için bir girdi üretir, hedef dil sırasını korur", () => {
        const defaults = buildProductTranslationDefaults()

        expect(defaults).toHaveLength(PRODUCT_FORM_TARGET_LOCALES.length)
        expect(defaults.map((entry) => entry.locale)).toEqual(PRODUCT_FORM_TARGET_LOCALES)
        expect(defaults.every((entry) => entry.name === "")).toBe(true)
    })

    it("mevcut çeviriyi doğru indekse yerleştirir", () => {
        const defaults = buildProductTranslationDefaults([
            { locale: "en", name: "Bakelite Handle", slug: "bakelite-handle", description: "desc" },
            // Varsayılan dil çevirisi burada YOK SAYILIR: TR ürünün kendi kolonlarında.
            { locale: "tr", name: "Yok sayılır" },
        ])

        const englishIndex = productTranslationIndex("en")

        expect(defaults[englishIndex]).toEqual({
            locale: "en",
            name: "Bakelite Handle",
            slug: "bakelite-handle",
            description: "desc",
        })
        expect(defaults.some((entry) => entry.locale === "tr")).toBe(false)
    })

    it("eksik alanları boş dizeye çevirir", () => {
        const defaults = buildProductTranslationDefaults([{ locale: "en", name: "Only name" }])
        const entry = defaults[productTranslationIndex("en")]

        expect(entry.slug).toBe("")
        expect(entry.description).toBe("")
    })
})
