import { describe, expect, it } from "vitest"

import { localizeProduct } from "./localizeProduct"

const now = new Date("2026-07-25T00:00:00.000Z")

function makeProduct(translations: Array<{
    locale: string
    name: string
    slug: string
    description?: string | null
}> = []) {
    return {
        id: "product-1",
        code: "10.11",
        name: "Türkçe Ürün",
        slug: "turkce-urun",
        description: "Türkçe açıklama",
        categoryId: "category-1",
        createdAt: now,
        updatedAt: now,
        translations: translations.map((translation) => ({
            id: `${translation.locale}-translation`,
            productId: "product-1",
            locale: translation.locale,
            name: translation.name,
            slug: translation.slug,
            description: translation.description ?? null,
            createdAt: now,
            updatedAt: now,
        })),
    }
}

describe("localizeProduct", () => {
    it("returns requested locale product fields when available", () => {
        const localized = localizeProduct(makeProduct([
            {
                locale: "tr",
                name: "Türkçe Ürün",
                slug: "turkce-urun",
                description: "Türkçe açıklama",
            },
            {
                locale: "en",
                name: "English Product",
                slug: "english-product",
                description: "English description",
            },
        ]), "en")

        expect(localized.name).toBe("English Product")
        expect(localized.slug).toBe("english-product")
        expect(localized.description).toBe("English description")
        expect(localized.resolvedLocale).toBe("en")
        expect(localized.translationMissing).toBe(false)
        expect(localized.alternateSlugs).toEqual({
            tr: "turkce-urun",
            en: "english-product",
        })
    })

    it("falls back to Turkish and marks target missing", () => {
        const localized = localizeProduct(makeProduct([
            {
                locale: "tr",
                name: "Türkçe Ürün",
                slug: "turkce-urun",
                description: "Türkçe açıklama",
            },
        ]), "en")

        expect(localized.name).toBe("Türkçe Ürün")
        expect(localized.slug).toBe("turkce-urun")
        expect(localized.description).toBe("Türkçe açıklama")
        expect(localized.resolvedLocale).toBe("tr")
        expect(localized.translationMissing).toBe(true)
    })

    it("keeps an explicit empty target description instead of falling back", () => {
        const localized = localizeProduct(makeProduct([
            {
                locale: "tr",
                name: "Türkçe Ürün",
                slug: "turkce-urun",
                description: "Türkçe açıklama",
            },
            {
                locale: "en",
                name: "English Product",
                slug: "english-product",
                description: null,
            },
        ]), "en")

        expect(localized.description).toBeNull()
        expect(localized.translationMissing).toBe(false)
    })
})
