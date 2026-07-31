import { describe, expect, it } from "vitest"

import {
    MessageCatalogError,
    applyTranslations,
    collectMissingKeys,
    findIncompleteArrays,
    flattenCatalog,
    getAtPath,
    parseMessagePath,
    setAtPath,
    validateTranslatedEntries,
    validateTranslatedMessage,
    type MessageNode,
} from "./messageCatalog"

describe("flattenCatalog", () => {
    it("iç içe düğümleri nokta yoluna indirger", () => {
        const flat = flattenCatalog({
            common: { siteName: "Ceyhunlar", nav: { home: "Ana Sayfa" } },
        })

        expect([...flat.keys()]).toEqual(["common.siteName", "common.nav.home"])
    })

    it("METİN dizilerine indeksle iner", () => {
        const flat = flattenCatalog({ hero: { words: ["hızlı", "dayanıklı"] } })

        expect([...flat]).toEqual([
            ["hero.words[0]", "hızlı"],
            ["hero.words[1]", "dayanıklı"],
        ])
    })

    it("NESNE dizilerine de iner", () => {
        // REGRESYON: diziler "string dizisi" varsayılıyordu; katalogdaki
        // `[{title, description}]` biçimi olduğu gibi DeepL'e gönderilip
        // "texts parameter must be a non-empty string" hatası üretiyordu.
        const flat = flattenCatalog({
            home: {
                services: {
                    cards: [
                        { title: "Ar-Ge", description: "Tasarım" },
                        { title: "3D Baskı", description: "Prototip" },
                    ],
                },
            },
        })

        expect([...flat]).toEqual([
            ["home.services.cards[0].title", "Ar-Ge"],
            ["home.services.cards[0].description", "Tasarım"],
            ["home.services.cards[1].title", "3D Baskı"],
            ["home.services.cards[1].description", "Prototip"],
        ])
    })

    it("her yaprak METİNdir", () => {
        const flat = flattenCatalog({ a: { b: [{ c: "x" }] } })
        expect([...flat.values()].every((value) => typeof value === "string")).toBe(true)
    })
})

describe("parseMessagePath", () => {
    it("indeksli yolları çözer", () => {
        expect(parseMessagePath("a.b[0].c")).toEqual(["a", "b", 0, "c"])
        expect(parseMessagePath("a[2]")).toEqual(["a", 2])
        expect(parseMessagePath("a")).toEqual(["a"])
    })

    it("boş yolu reddeder", () => {
        expect(() => parseMessagePath("")).toThrow(MessageCatalogError)
    })
})

describe("collectMissingKeys", () => {
    it("eksik ve boş bırakılmış anahtarları toplar", () => {
        const missing = collectMissingKeys(
            { a: "A", b: "B", c: "C" },
            { a: "Çeviri", b: "   " },
        )

        expect(missing.map(({ key }) => key)).toEqual(["b", "c"])
    })

    it("KAYNAĞI boş anahtarı atlar", () => {
        // DeepL boş metni reddediyor; boş bir kaynağın çevirisi de yok.
        expect(collectMissingKeys({ a: "", b: "   ", c: "dolu" }, {}))
            .toEqual([{ key: "c", source: "dolu" }])
    })

    it("mevcut çeviriyi ASLA yeniden göndermez", () => {
        // Elle düzeltilmiş bir çeviriyi makine çevirisiyle ezmek en pahalı hata.
        expect(collectMissingKeys({ a: "A" }, { a: "Elle düzeltildi" })).toEqual([])
    })

    it("nesne dizisi elemanlarını tek tek eksik sayar", () => {
        const reference = { cards: [{ title: "Bir" }, { title: "İki" }] }
        const target = { cards: [{ title: "One" }] }

        expect(collectMissingKeys(reference, target))
            .toEqual([{ key: "cards[1].title", source: "İki" }])
    })
})

describe("setAtPath", () => {
    it("eksik nesne düğümlerini oluşturur", () => {
        const node: MessageNode = {}
        setAtPath(node, "a.b.c", "değer")
        expect(getAtPath(node, "a.b.c")).toBe("değer")
    })

    it("sayısal segmentte DİZİ oluşturur", () => {
        const node: MessageNode = {}
        setAtPath(node, "cards[1].title", "İki")

        expect(Array.isArray((node as { cards: unknown }).cards)).toBe(true)
        expect(getAtPath(node, "cards[1].title")).toBe("İki")
    })

    it("bir metnin üstüne kapsayıcı yazmayı reddeder", () => {
        expect(() => setAtPath({ a: "metin" }, "a.b", "x")).toThrow(MessageCatalogError)
    })
})

describe("validateTranslatedMessage", () => {
    it("temiz çeviride sorun bulmaz", () => {
        expect(validateTranslatedMessage({
            key: "k",
            source: "Merhaba {name}",
            translated: "Hello {name}",
        })).toEqual([])
    })

    it("DÜŞEN argümanı yakalar", () => {
        expect(validateTranslatedMessage({
            key: "cart.total",
            source: "{count} ürün",
            translated: "items",
        })).toEqual(["cart.total: missing argument {count}"])
    })

    it("ADI DEĞİŞEN argümanı yakalar", () => {
        expect(validateTranslatedMessage({
            key: "k",
            source: "{count} ürün",
            translated: "{sayi} items",
        })).toEqual(["k: missing argument {count}"])
    })

    it("düşen rich-text etiketini yakalar", () => {
        expect(validateTranslatedMessage({
            key: "hero.title",
            source: "Biz <highlight>üretiriz</highlight>",
            translated: "We manufacture",
        })).toEqual(["hero.title: missing tag <highlight>"])
    })

    it("bozuk ICU sözdizimini yakalar", () => {
        const problems = validateTranslatedMessage({
            key: "k",
            source: "{count} ürün",
            translated: "{count items",
        })

        expect(problems).toHaveLength(1)
        expect(problems[0]).toContain("not valid ICU")
    })

    it("ICU YAPISININ değişmesine izin verir", () => {
        // TR'de sayıdan sonra çoğul eki yok; hedef dilde plural açmak meşru.
        expect(validateTranslatedMessage({
            key: "k",
            source: "{count} ürün",
            translated: "{count, plural, one {# item} other {# items}}",
        })).toEqual([])
    })

    it("boş çeviriyi reddeder", () => {
        expect(validateTranslatedMessage({ key: "k", source: "A", translated: "  " }))
            .toEqual(["k: translation is empty"])
    })
})

describe("findIncompleteArrays", () => {
    const reference: MessageNode = {
        home: { cards: [{ title: "Bir" }, { title: "İki" }, { title: "Üç" }] },
        other: "x",
    }

    it("YARIM kalmış diziyi yakalar", () => {
        // Birleştirme dizileri BÜTÜN olarak değiştiriyor: 3 kartın 1'i çevrilmiş
        // bir katalog o dilde 3 yerine 1 kart gösterir — içerik kaybı.
        const incomplete = findIncompleteArrays(reference, {
            home: { cards: [{ title: "One" }] },
        })

        expect(incomplete).toEqual([{
            arrayPath: "home.cards",
            missingKeys: ["home.cards[1].title", "home.cards[2].title"],
        }])
    })

    it("tam çevrilmiş diziyi sorun saymaz", () => {
        expect(findIncompleteArrays(reference, {
            home: { cards: [{ title: "One" }, { title: "Two" }, { title: "Three" }] },
        })).toEqual([])
    })

    it("hiç dokunulmamış diziyi sorun saymaz", () => {
        // Eksik anahtar zararsız: fallback zinciri onu İngilizce/Türkçe'ye düşürür.
        expect(findIncompleteArrays(reference, { other: "y" })).toEqual([])
    })
})

describe("applyTranslations", () => {
    it("kopya üzerine yazar, girdiyi bozmaz", () => {
        const catalog: MessageNode = { common: { title: "Eski" } }
        const next = applyTranslations(catalog, [
            { key: "common.title", target: "New" },
            { key: "common.nav.home", target: "Home" },
            { key: "cards[0].title", target: "First" },
        ])

        expect(getAtPath(next, "common.title")).toBe("New")
        expect(getAtPath(next, "common.nav.home")).toBe("Home")
        expect(getAtPath(next, "cards[0].title")).toBe("First")
        expect(catalog).toEqual({ common: { title: "Eski" } })
    })
})

describe("validateTranslatedEntries", () => {
    it("tüm sorunları tek listede toplar", () => {
        expect(validateTranslatedEntries([
            { key: "a", source: "{n} adet", target: "items" },
            { key: "b", source: "temiz", target: "clean" },
            { key: "c", source: "<b>x</b>", target: "x" },
        ])).toEqual([
            "a: missing argument {n}",
            "c: missing tag <b>",
        ])
    })
})
