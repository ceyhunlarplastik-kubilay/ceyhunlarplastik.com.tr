import { describe, expect, it } from "vitest"

import { localizeProductIndustrialUsage } from "./localizeProductIndustrialUsage"

const now = new Date("2026-07-24T00:00:00.000Z")

type TranslationSeed = {
    locale: string
    usageFunction?: string | null
    imageKey?: string | null
}

function makeUsage(
    translations: TranslationSeed[] = [],
    overrides: { usageFunction?: string | null; imageKey?: string | null } = {},
) {
    return {
        id: "usage-1",
        productId: "product-1",
        sectorValueId: null,
        productionGroupValueId: null,
        usageAreaValueId: null,
        usageFunction: "Türkçe açıklama",
        imageKey: null,
        displayOrder: 0,
        createdAt: now,
        updatedAt: now,
        ...overrides,
        translations: translations.map((translation) => ({
            id: `${translation.locale}-translation`,
            productIndustrialUsageId: "usage-1",
            locale: translation.locale,
            usageFunction: translation.usageFunction ?? null,
            imageKey: translation.imageKey ?? null,
            createdAt: now,
            updatedAt: now,
        })),
    }
}

describe("localizeProductIndustrialUsage", () => {
    it("returns requested locale usageFunction when available", () => {
        const localized = localizeProductIndustrialUsage(makeUsage([
            { locale: "tr", usageFunction: "Türkçe açıklama" },
            { locale: "en", usageFunction: "English explanation" },
        ]), "en")

        expect(localized.usageFunction).toBe("English explanation")
        expect(localized.resolvedLocale).toBe("en")
        expect(localized.translationMissing).toBe(false)
    })

    it("falls back to Turkish and marks target translation missing", () => {
        const localized = localizeProductIndustrialUsage(makeUsage([
            { locale: "tr", usageFunction: "Türkçe açıklama" },
        ]), "en")

        expect(localized.usageFunction).toBe("Türkçe açıklama")
        expect(localized.resolvedLocale).toBe("tr")
        expect(localized.translationMissing).toBe(true)
    })

    it("does not mark missing when there is no source text to translate", () => {
        const localized = localizeProductIndustrialUsage({
            ...makeUsage(),
            usageFunction: null,
        }, "en")

        expect(localized.usageFunction).toBeNull()
        expect(localized.translationMissing).toBe(false)
    })

    describe("locale-specific image", () => {
        it("prefers the requested locale image over the default one", () => {
            const localized = localizeProductIndustrialUsage(
                makeUsage(
                    [
                        { locale: "tr", usageFunction: "Türkçe açıklama" },
                        { locale: "en", usageFunction: "English explanation", imageKey: "en/usage.png" },
                    ],
                    { imageKey: "default/usage.png" },
                ),
                "en",
            )

            expect(localized.imageKey).toBe("en/usage.png")
        })

        it("falls back to the default image when the locale has none", () => {
            const localized = localizeProductIndustrialUsage(
                makeUsage(
                    [
                        { locale: "tr", usageFunction: "Türkçe açıklama" },
                        { locale: "en", usageFunction: "English explanation" },
                    ],
                    { imageKey: "default/usage.png" },
                ),
                "en",
            )

            expect(localized.imageKey).toBe("default/usage.png")
        })

        it("resolves an image-only translation row even without translated text", () => {
            const localized = localizeProductIndustrialUsage(
                makeUsage(
                    [
                        { locale: "tr", usageFunction: "Türkçe açıklama" },
                        { locale: "en", imageKey: "en/usage.png" },
                    ],
                    { imageKey: "default/usage.png" },
                ),
                "en",
            )

            expect(localized.imageKey).toBe("en/usage.png")
            // Metin çevirisi yok → TR metnine düşer ve eksik olarak işaretlenir.
            expect(localized.usageFunction).toBe("Türkçe açıklama")
            expect(localized.translationMissing).toBe(true)
        })

        it("returns null when neither the locale nor the default has an image", () => {
            const localized = localizeProductIndustrialUsage(makeUsage([
                { locale: "tr", usageFunction: "Türkçe açıklama" },
            ]), "en")

            expect(localized.imageKey).toBeNull()
        })

        it("uses the default image for the default locale", () => {
            const localized = localizeProductIndustrialUsage(
                makeUsage(
                    [{ locale: "tr", usageFunction: "Türkçe açıklama" }],
                    { imageKey: "default/usage.png" },
                ),
                "tr",
            )

            expect(localized.imageKey).toBe("default/usage.png")
        })
    })
})
