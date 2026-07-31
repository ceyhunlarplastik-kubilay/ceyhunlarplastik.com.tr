import { describe, expect, it } from "vitest"

import {
    buildTranslationSlug,
    isTranslationNameTooShort,
} from "./translationSlug"

/**
 * Bu testler slugify'ın gerçek davranışını sabitler. Dil dalgaları açılırken
 * bir dilin sessizce boş slug üretmeye başlaması (veya tersi) burada görünür.
 */
describe("buildTranslationSlug", () => {
    it.each([
        ["tr", "Bakalit Tutamak", "bakalit-tutamak"],
        ["en", "Bakelite Handle", "bakelite-handle"],
        ["fr", "Poignée bakélite", "poignee-bakelite"],
        ["it", "Maniglia in bachelite", "maniglia-in-bachelite"],
        ["pl", "Uchwyt bakelitowy", "uchwyt-bakelitowy"],
        // Kiril ve Arapça'nın slugify'da charmap'i var — boş dönmezler.
        ["ru", "Бакелитовые ручки", "bakelitovye-ruchki"],
        ["ar", "مقابض الباكليت", "mqabdh-albaklyt"],
    ] as const)("%s dilinde slug üretir", (locale, input, expected) => {
        expect(buildTranslationSlug(input, locale)).toBe(expected)
    })

    it.each([
        ["ko", "베이클라이트 핸들"],
        ["ja", "ベークライトハンドル"],
        ["zh", "电木手柄"],
        ["hi", "बैकेलाइट हैंडल"],
    ] as const)("%s dilinde BOŞ döner (fallback şart)", (locale, input) => {
        expect(buildTranslationSlug(input, locale)).toBe("")
    })

    it("karışık metinde yalnız Latin/rakam parçasına çöker", () => {
        // Çakışma mıknatısı: farklı ürünler aynı parçaya inebilir. Fallback bu
        // yüzden yalnız TAM boş çıktıda değil, üretimin güvenilmez olduğu her
        // yerde gözden geçirilmeli.
        expect(buildTranslationSlug("핸들 M8", "ko")).toBe("m8")
    })
})

describe("isTranslationNameTooShort", () => {
    it("tek karakterli CJK adlarını kabul eder", () => {
        // Eski taban 2 karakterdi ve `赤` (kırmızı) gibi geçerli adları reddediyordu.
        expect(isTranslationNameTooShort("赤")).toBe(false)
        expect(isTranslationNameTooShort("青")).toBe(false)
    })

    it("boş/whitespace adı reddeder", () => {
        expect(isTranslationNameTooShort("")).toBe(true)
        expect(isTranslationNameTooShort("   ")).toBe(true)
    })
})
