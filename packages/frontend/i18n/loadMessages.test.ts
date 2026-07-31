import { describe, expect, it } from "vitest"

import { loadMessages, __testing } from "./loadMessages"
import { routing } from "./routing"

const { mergeMessages, buildFallbackChain } = __testing

type MessageTree = { [key: string]: string | string[] | MessageTree }

describe("mergeMessages", () => {
    it("derin objeleri birleştirir, override kazanır", () => {
        const base = { a: { x: "tr-x", y: "tr-y" }, b: "tr-b" }
        const override = { a: { y: "en-y" } }

        expect(mergeMessages(base, override)).toEqual({
            a: { x: "tr-x", y: "en-y" },
            b: "tr-b",
        })
    })

    it("dizileri eleman bazında DEĞİL, bütün olarak override eder", () => {
        // Kataloglardaki diziler sıralı içerik listeleri; yarı çevrilmiş bir dizi
        // (ör. 4 elemanın 2'si İngilizce) anlamsız olur.
        const base = { words: ["bir", "iki", "üç"] }
        const override = { words: ["one", "two"] }

        expect(mergeMessages(base, override)).toEqual({ words: ["one", "two"] })
    })

    it("null'ı obje sanıp içine inmez", () => {
        expect(mergeMessages({ a: { b: "x" } }, { a: null })).toEqual({ a: null })
    })
})

describe("loadMessages", () => {
    it("varsayılan dilde TÜRKÇE içerik döndürür", async () => {
        // REGRESYON: zincir tekrarları ilk görülene göre eliyordu, bu yüzden
        // `tr` istendiğinde sondaki `tr` düşüyor ve İngilizce onu eziyordu —
        // site Türkçe seçiliyken İngilizce açılıyordu.
        // Bu testin eski hâli yalnız `toHaveProperty("common.siteName")` diyordu;
        // o anahtar iki katalogda da olduğu için hatayı GÖREMİYORDU. Değer
        // doğrulanmadan yapı doğrulamak yetmiyor.
        const messages = (await loadMessages(routing.defaultLocale)) as MessageTree
        const chrome = messages.chrome as MessageTree

        expect((chrome.nav as MessageTree).corporate).toBe("Kurumsal")
        expect((chrome.nav as MessageTree).contact).toBe("İletişim")
    })

    it("zincirde istenen dil HER ZAMAN sonda olur", () => {
        expect(buildFallbackChain("tr")).toEqual(["tr"])
        expect(buildFallbackChain("en")).toEqual(["tr", "en"])
        expect(buildFallbackChain("de")).toEqual(["tr", "en", "de"])
    })

    it("bilinmeyen dilde bile zincir sayesinde boş dönmez", async () => {
        // Kataloğu olmayan bir dil: import başarısız olur ve zincir tr/en ile dolar.
        // Dil dalgalarında bir dil, çevirisi tamamlanmadan da render edilebilsin diye.
        const messages = (await loadMessages("de")) as MessageTree
        const chrome = messages.chrome as MessageTree

        // Katalog yok → zincir tr+en ile dolar, en sonda en olduğu için İngilizce görünür.
        expect((chrome.nav as MessageTree).corporate).toBe("Corporate")
    })

    it("istenen dil, İngilizce'yi ve Türkçe'yi ezer", async () => {
        const messages = (await loadMessages("en")) as MessageTree

        // chrome.nav.corporate TR'de "Kurumsal", EN'de "Corporate"
        const chrome = messages.chrome as MessageTree
        expect((chrome.nav as MessageTree).corporate).toBe("Corporate")
    })
})
