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

/**
 * Latin-parça tuzağı (2026-08-06, ko ve ja apply'larında iki kez ısırdı).
 *
 * CJK/Devanagari adlarda gömülü Latin/rakam parçası kalırsa slugify yalnız o
 * parçaya çöker ("PVC 모서리 세척기" → "pvc"). Farklı değerler aynı parçaya
 * düşünce `@@unique([locale, slug])` altında çakışırlar. Bu yüzden ADDAN
 * türetim yozlaşmışsa boş dönülür ve çağıran varsayılan dilin slug'ına düşer.
 */
describe("buildTranslationSlug — addan türetim yozlaşması", () => {
    it.each([
        ["ko", "PVC 모서리 세척기"],
        ["ko", "핸들 M8"],
        ["ja", "PVC コーナークリーニングマシン"],
        ["ja", "3~4個モーター"],
        ["zh", "PVC 角清洁机"],
        ["hi", "PVC कोना सफाई मशीन"],
        ["ko", "베이클라이트 핸들"],
        ["ja", "赤"],
    ] as const)("%s: %s → boş (varsayılan dile düşer)", (locale, name) => {
        expect(buildTranslationSlug(name, locale, { derivedFromName: true })).toBe("")
    })

    it.each([
        ["ru", "Бакелитовые ручки", "bakelitovye-ruchki"],
        ["ar", "مقابض الباكليت", "mqabdh-albaklyt"],
        ["tr", "Çark Tipi", "cark-tipi"],
        ["de", "Bakelit-Griffe", "bakelit-griffe"],
        ["ko", "USB Type-C", "usb-type-c"],
    ] as const)("%s: %s → sağlam kalır", (locale, name, expected) => {
        expect(buildTranslationSlug(name, locale, { derivedFromName: true })).toBe(expected)
    })

    it("açık slug asla yozlaşma kontrolüne girmez — admin tercihi korunur", () => {
        expect(buildTranslationSlug("pvc-kose-temizleme", "ko")).toBe("pvc-kose-temizleme")
        expect(buildTranslationSlug("m8", "ja")).toBe("m8")
    })
})
