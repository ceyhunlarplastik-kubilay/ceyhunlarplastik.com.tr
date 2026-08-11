import { describe, expect, it } from "vitest"

import { SUPPORTED_LOCALES } from "@/core/i18n/locales"

import {
    CATEGORY_NAME_TEMPLATES,
    SERIES_WORD_BY_LOCALE,
    checkSourceRoundTrip,
    composeProductName,
    dropWordsSharedWithCategory,
    normalizeForMatch,
    resolveTemplate,
    serializeTemplate,
} from "./productNameFormula"

describe("CATEGORY_NAME_TEMPLATES", () => {
    it("her şablon sayı + seri ile başlar", () => {
        for (const [code, template] of Object.entries(CATEGORY_NAME_TEMPLATES)) {
            expect(template[0], `kategori ${code}`).toEqual({ kind: "number" })
            expect(template[1], `kategori ${code}`).toEqual({ kind: "series" })
        }
    })

    it("kategori adı yalnız sonda ve en fazla bir kez kullanılır", () => {
        for (const [code, template] of Object.entries(CATEGORY_NAME_TEMPLATES)) {
            const categoryIndexes = template
                .map((slot, index) => (slot.kind === "category" ? index : -1))
                .filter((index) => index >= 0)

            expect(categoryIndexes.length, `kategori ${code}`).toBeLessThanOrEqual(1)
            if (categoryIndexes.length === 1) {
                expect(categoryIndexes[0], `kategori ${code}`).toBe(template.length - 1)
            }
        }
    })

    it("ürün sahibinin verdiği tabloyu birebir yansıtır", () => {
        const expected: Record<number, string> = {
            1: "number + series + attr:connection_type + attr:model_type + category",
            2: "number + series + attr:connection_type + attr:model_type + category",
            3: "number + series + attr:connection_type + attr:model_type + category",
            4: "number + series + attr:material_type + attr:model_type + category",
            5: "number + series + attr:connection_type + attr:model_type + category",
            7: "number + series + attr:connection_type + attr:profile_type + attr:model_type",
            8: "number + series + attr:connection_type + attr:profile_type + category",
            9: "number + series + attr:model_type + attr:connection_type",
            10: "number + series + attr:usage_type + attr:hat_type + attr:profile_type + category",
            12: "number + series + attr:connection_type + attr:material_type + category",
            13: "number + series + attr:model_type",
            16: "number + series + attr:model_type + category",
            17: "number + series + category",
            18: "number + series + attr:model_type + category",
            19: "number + series + attr:model_type + category",
            21: "number + series + attr:connection_type + attr:model_type",
            22: "number + series + category",
            30: "number + series + attr:model_type",
        }

        for (const [code, shape] of Object.entries(expected)) {
            const template = resolveTemplate(Number(code))
            expect(template && serializeTemplate(template), `kategori ${code}`).toBe(shape)
        }
    })

    it("formülü verilmemiş kategoriler null döner (DeepL'e düşerler)", () => {
        expect(resolveTemplate(11)).toBeNull()
        expect(resolveTemplate(14)).toBeNull()
        expect(resolveTemplate(undefined)).toBeNull()
    })
})

describe("SERIES_WORD_BY_LOCALE", () => {
    it("desteklenen her dil için karşılık taşır", () => {
        for (const locale of SUPPORTED_LOCALES) {
            expect(SERIES_WORD_BY_LOCALE[locale]?.length, locale).toBeGreaterThan(0)
        }
    })
})

describe("composeProductName", () => {
    // Gerçek prod verisi, ürün kodu 1.1.
    const bakalit = {
        sourceName: "11 Serisi Burç Bağlantılı Elcik Tipi Bakalit Tutamaklar",
        template: resolveTemplate(1)!,
    }

    it("hedef dilde bestelenmiş adı üretir", () => {
        const result = composeProductName({
            ...bakalit,
            locale: "en",
            parts: {
                attributeValues: {
                    connection_type: "Bushed Connector",
                    model_type: "Knob Handles",
                },
                categoryName: "Bakelite Handles",
            },
        })

        expect(result).toEqual({
            ok: true,
            name: "11 Series Bushed Connector Knob Handles Bakelite Handles",
        })
    })

    it("seri numarasını olduğu gibi korur, seri kelimesini çevirir", () => {
        const result = composeProductName({
            ...bakalit,
            locale: "de",
            parts: {
                attributeValues: {
                    connection_type: "Steckverbinder mit Buchse",
                    model_type: "Knaufgriffe",
                },
                categoryName: "Bakelit-Griffe",
            },
        })

        expect(result.ok && result.name).toBe(
            "11 Serie Steckverbinder mit Buchse Knaufgriffe Bakelit-Griffe",
        )
    })

    it("ondalıklı seri numarasını korur (9.1 …)", () => {
        const result = composeProductName({
            template: resolveTemplate(9)!,
            sourceName: "9.1 Serisi Plastik Gövdeli Mafsallı Civata Bağlantılı Ayaklar",
            locale: "en",
            parts: {
                attributeValues: {
                    model_type: "Plastic Body",
                    connection_type: "Articulated Bolted Feet",
                },
                categoryName: "Bolted Feet",
            },
        })

        // Kategori 9'da kategori adı SONDA YOK.
        expect(result.ok && result.name).toBe("9.1 Series Plastic Body Articulated Bolted Feet")
    })

    it("atanmamış özellik varsa hangisinin eksik olduğunu söyler", () => {
        const result = composeProductName({
            ...bakalit,
            locale: "en",
            parts: {
                attributeValues: { model_type: "Knob Handles" },
                categoryName: "Bakelite Handles",
            },
        })

        expect(result).toEqual({
            ok: false,
            reason: "missing-attribute",
            missing: ["connection_type"],
        })
    })

    it("kategori 17'de attribute kullanmaz", () => {
        const result = composeProductName({
            template: resolveTemplate(17)!,
            sourceName: "171 Serisi Kamp Mobilyası Aksesuarları",
            locale: "en",
            parts: { attributeValues: {}, categoryName: "Camping Furniture Accessories" },
        })

        expect(result.ok && result.name).toBe("171 Series Camping Furniture Accessories")
    })
})

describe("kategori 10 — kategoriyle çakışan kelimenin atılması", () => {
    it("tr: 'Kutu Profil' + 'Profil Tapaları' → 'Kutu'", () => {
        const result = composeProductName({
            template: resolveTemplate(10)!,
            sourceName: "101 Serisi İçe Geçen Düz Şapkalı Kutu Profil Tapaları",
            locale: "tr",
            parts: {
                attributeValues: {
                    usage_type: "İçe Geçen",
                    hat_type: "Düz Şapkalı",
                    profile_type: "Kutu Profil",
                },
                categoryName: "Profil Tapaları",
            },
        })

        expect(result.ok && result.name).toBe("101 Serisi İçe Geçen Düz Şapkalı Kutu Profil Tapaları")
    })

    it("en: 'Box Profile' + 'Profile Plugs' → 'Box'", () => {
        const result = composeProductName({
            template: resolveTemplate(10)!,
            sourceName: "101 Serisi İçe Geçen Düz Şapkalı Kutu Profil Tapaları",
            locale: "en",
            parts: {
                attributeValues: {
                    usage_type: "Introvert",
                    hat_type: "Flat Cap",
                    profile_type: "Box Profile",
                },
                categoryName: "Profile Plugs",
            },
        })

        expect(result.ok && result.name).toBe("101 Series Introvert Flat Cap Box Profile Plugs")
    })

    it("ortak kelime yoksa değere DOKUNMAZ (Almanca bileşik kelimeler)", () => {
        expect(dropWordsSharedWithCategory("Box-Profil", "Profilstopfen")).toBe("Box-Profil")
    })

    it("bütün kelimeler elenecek olursa orijinali korur", () => {
        expect(dropWordsSharedWithCategory("Profil", "Profil Tapaları")).toBe("Profil")
    })
})

describe("normalizeForMatch — gerçek yazım tutarsızlıkları", () => {
    it("ç/c ve ı/i farkını yok sayar", () => {
        expect(normalizeForMatch("Elçik Tipi")).toBe(normalizeForMatch("Elcik Tipi"))
        expect(normalizeForMatch("Çift Cıvata Bağlantılı")).toBe(
            normalizeForMatch("Çift Civata Bağlantılı"),
        )
    })

    it("fazla boşluk ve noktalamayı toplar", () => {
        expect(normalizeForMatch("Teknik  Hırdavat")).toBe(normalizeForMatch("Teknik Hırdavat"))
        expect(normalizeForMatch("Metal Gövdeli, Kauçuk Tabanlı")).toBe(
            normalizeForMatch("Metal Gövdeli Kauçuk Tabanlı"),
        )
    })
})

describe("checkSourceRoundTrip", () => {
    const parts = {
        attributeValues: {
            connection_type: "Burç Bağlantılı",
            model_type: "Elcik Tipi",
        },
        categoryName: "Bakalit Tutamaklar",
    }

    it("tutarlı üründe eşleşir", () => {
        const result = checkSourceRoundTrip({
            template: resolveTemplate(1)!,
            sourceName: "11 Serisi Burç Bağlantılı Elcik Tipi Bakalit Tutamaklar",
            parts,
        })

        expect(result.matches).toBe(true)
    })

    it("adı yanlış yazılmış üründe eşleşmez ve attributelardan doğrusunu üretir", () => {
        // Canlı örnek: adda "Kollu" fazlalığı var, model_type yalnız "Çark Tipi".
        const result = checkSourceRoundTrip({
            template: resolveTemplate(3)!,
            sourceName: "338 Serisi Bağlantı Yuvalı Kollu Çark Tipi Plastik Tutamaklar",
            parts: {
                attributeValues: {
                    connection_type: "Bağlantı Yuvalı",
                    model_type: "Çark Tipi",
                },
                categoryName: "Plastik Tutamaklar",
            },
        })

        expect(result.matches).toBe(false)
        expect(result.composed).toBe("338 Serisi Bağlantı Yuvalı Çark Tipi Plastik Tutamaklar")
    })
})
