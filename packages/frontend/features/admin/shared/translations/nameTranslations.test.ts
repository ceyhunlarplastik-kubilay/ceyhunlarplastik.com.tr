import { describe, expect, it } from "vitest"

import { TARGET_LOCALES } from "@core/i18n/locales"
import { adminTranslationIndex, ADMIN_TARGET_LOCALES } from "./adminLocales"
import {
    buildNameTranslationDefaults,
    buildNameTranslationsPayload,
    filledTranslationLocales,
} from "./nameTranslations"

describe("buildNameTranslationDefaults", () => {
    it("her hedef dil için bir girdi üretir, sırası TARGET_LOCALES ile aynı", () => {
        // RHF yolları (`translations.<index>.name`) bu sıradan hesaplanıyor;
        // sıra kayarsa girilen ad başka bir dile yazılır.
        const defaults = buildNameTranslationDefaults()

        expect(defaults).toHaveLength(TARGET_LOCALES.length)
        expect(defaults.map((item) => item.locale)).toEqual([...TARGET_LOCALES])
        expect(defaults.every((item) => item.name === "")).toBe(true)
    })

    it("mevcut çevirileri doğru indekse yerleştirir", () => {
        const defaults = buildNameTranslationDefaults([
            { locale: "de", name: "Rot" },
            { locale: "en", name: "Red" },
            // Desteklenmeyen bir dil sessizce yok sayılır.
            { locale: "xx", name: "???" },
        ])

        expect(defaults[adminTranslationIndex("en")].name).toBe("Red")
        expect(defaults[adminTranslationIndex("de")].name).toBe("Rot")
        expect(defaults[adminTranslationIndex("fr")].name).toBe("")
    })
})

describe("buildNameTranslationsPayload", () => {
    it("oluşturmada yalnız dolu adları gönderir", () => {
        const payload = buildNameTranslationsPayload({
            translations: buildNameTranslationDefaults([{ locale: "en", name: " Red " }]),
        })

        expect(payload).toEqual({ translations: [{ locale: "en", name: "Red" }] })
    })

    it("DEĞİŞEN çeviriyi günceller — mevcut çeviri artık düzeltilebiliyor", () => {
        const payload = buildNameTranslationsPayload({
            translations: buildNameTranslationDefaults([{ locale: "en", name: "Crimson" }]),
            existing: [{ locale: "en", name: "Red" }],
        })

        expect(payload).toEqual({ translations: [{ locale: "en", name: "Crimson" }] })
    })

    it("boşaltılan çeviriyi siler", () => {
        const payload = buildNameTranslationsPayload({
            translations: buildNameTranslationDefaults([{ locale: "en", name: "" }]),
            existing: [{ locale: "en", name: "Red" }],
        })

        expect(payload).toEqual({ removeTranslationLocales: ["en"] })
    })

    it("değişmeyen çeviriye dokunmaz — boş payload üretir", () => {
        const payload = buildNameTranslationsPayload({
            translations: buildNameTranslationDefaults([{ locale: "en", name: "Red" }]),
            existing: [{ locale: "en", name: "Red" }],
        })

        expect(payload).toEqual({})
    })

    it("aynı istekte hem güncelleme hem silme taşıyabilir", () => {
        const payload = buildNameTranslationsPayload({
            translations: buildNameTranslationDefaults([
                { locale: "en", name: "Crimson" },
                { locale: "de", name: "" },
            ]),
            existing: [
                { locale: "en", name: "Red" },
                { locale: "de", name: "Rot" },
            ],
        })

        expect(payload).toEqual({
            translations: [{ locale: "en", name: "Crimson" }],
            removeTranslationLocales: ["de"],
        })
    })

    it("varsayılan dili çeviri satırı olarak göndermez", () => {
        // Türkçe ad kaydın kendi kolonunda; buraya sızarsa backend 400 verir.
        const payload = buildNameTranslationsPayload({
            translations: [{ locale: "tr", name: "Kırmızı" }],
        })

        expect(payload).toEqual({})
    })
})

describe("filledTranslationLocales", () => {
    it("yalnız içeriği olan dilleri döner", () => {
        expect(
            filledTranslationLocales(
                buildNameTranslationDefaults([
                    { locale: "en", name: "Red" },
                    { locale: "de", name: "   " },
                ]),
            ),
        ).toEqual(["en"])
    })
})

describe("adminTranslationIndex", () => {
    it("varsayılan dil için -1 döner — dizide yeri yok", () => {
        expect(adminTranslationIndex("tr")).toBe(-1)
        expect(ADMIN_TARGET_LOCALES).not.toContain("tr")
    })
})
