import { describe, expect, it } from "vitest"

import { localizeProductIndustrialUsage } from "./localizeProductIndustrialUsage"

const now = new Date("2026-07-24T00:00:00.000Z")

function makeUsage(translations: Array<{ locale: string; usageFunction: string }> = []) {
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
        translations: translations.map((translation) => ({
            id: `${translation.locale}-translation`,
            productIndustrialUsageId: "usage-1",
            locale: translation.locale,
            usageFunction: translation.usageFunction,
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
})
