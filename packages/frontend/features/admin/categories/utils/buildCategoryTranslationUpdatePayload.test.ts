import { describe, expect, it } from "vitest"

import { buildCategoryTranslationUpdatePayload } from "./buildCategoryTranslationUpdatePayload"

describe("buildCategoryTranslationUpdatePayload", () => {
    it("sends only the changed English translation", () => {
        const payload = buildCategoryTranslationUpdatePayload({
            name: "Bakalit Tutamaklar",
            englishName: "Bakelite Handles",
            nameChanged: false,
            englishNameChanged: true,
            hasEnglishTranslation: false,
        })

        expect(payload).toEqual({
            translations: [{ locale: "en", name: "Bakelite Handles" }],
        })
        expect(payload).not.toHaveProperty("name")
        expect(payload).not.toHaveProperty("allowedAttributeValueIds")
    })

    it("removes an existing English translation when its field is cleared", () => {
        const payload = buildCategoryTranslationUpdatePayload({
            name: "Bakalit Tutamaklar",
            englishName: "",
            nameChanged: false,
            englishNameChanged: true,
            hasEnglishTranslation: true,
        })

        expect(payload).toEqual({ removeTranslationLocales: ["en"] })
    })
})
