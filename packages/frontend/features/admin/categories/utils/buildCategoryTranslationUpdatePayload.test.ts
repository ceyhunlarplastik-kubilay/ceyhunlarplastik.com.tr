import { describe, expect, it } from "vitest"

import { buildNameTranslationDefaults } from "@/features/admin/shared/translations/nameTranslations"
import { buildCategoryTranslationUpdatePayload } from "./buildCategoryTranslationUpdatePayload"

describe("buildCategoryTranslationUpdatePayload", () => {
    it("yalnız değişen çeviriyi gönderir", () => {
        const payload = buildCategoryTranslationUpdatePayload({
            name: "Bakalit Tutamaklar",
            nameChanged: false,
            translations: buildNameTranslationDefaults([
                { locale: "en", name: "Bakelite Handles" },
            ]),
        })

        expect(payload).toEqual({
            translations: [{ locale: "en", name: "Bakelite Handles" }],
        })
        expect(payload).not.toHaveProperty("name")
        expect(payload).not.toHaveProperty("allowedAttributeValueIds")
    })

    it("boşaltılan mevcut çeviriyi kaldırır", () => {
        const payload = buildCategoryTranslationUpdatePayload({
            name: "Bakalit Tutamaklar",
            nameChanged: false,
            translations: buildNameTranslationDefaults([{ locale: "en", name: "" }]),
            existingTranslations: [{ locale: "en", name: "Bakelite Handles" }],
        })

        expect(payload).toEqual({ removeTranslationLocales: ["en"] })
    })

    it("İngilizce dışındaki dilleri de taşır", () => {
        // Tek dilli varsayım kalktı: aynı kaydetmede birden çok dil güncellenebilir.
        const payload = buildCategoryTranslationUpdatePayload({
            name: "Bakalit Tutamaklar",
            nameChanged: true,
            translations: buildNameTranslationDefaults([
                { locale: "de", name: "Bakelitgriffe" },
                { locale: "fr", name: "Poignées en bakélite" },
            ]),
        })

        expect(payload).toEqual({
            name: "Bakalit Tutamaklar",
            translations: [
                { locale: "de", name: "Bakelitgriffe" },
                { locale: "fr", name: "Poignées en bakélite" },
            ],
        })
    })

    it("hiçbir şey değişmediyse boş payload üretir", () => {
        const payload = buildCategoryTranslationUpdatePayload({
            name: "Bakalit Tutamaklar",
            nameChanged: false,
            translations: buildNameTranslationDefaults([
                { locale: "en", name: "Bakelite Handles" },
            ]),
            existingTranslations: [{ locale: "en", name: "Bakelite Handles" }],
        })

        expect(payload).toEqual({})
    })
})
