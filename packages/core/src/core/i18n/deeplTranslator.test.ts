import type { DeepLClient } from "deepl-node"
import { describe, expect, it, vi } from "vitest"

import {
    DEEPL_MAX_TEXTS_PER_REQUEST,
    DeepLTranslator,
    assertDeepLQuotaAvailable,
    createDeepLRequestBatches,
    estimateTranslationCharacters,
} from "./deeplTranslator"

describe("DeepLTranslator", () => {
    it("batches at most 50 texts per request", () => {
        const texts = Array.from(
            { length: DEEPL_MAX_TEXTS_PER_REQUEST + 1 },
            (_, index) => `Category ${index}`,
        )

        const batches = createDeepLRequestBatches(texts)

        expect(batches).toHaveLength(2)
        expect(batches[0]).toHaveLength(DEEPL_MAX_TEXTS_PER_REQUEST)
        expect(batches[1]).toHaveLength(1)
    })

    it("BOŞ metni ağ isteğinden ÖNCE reddeder", async () => {
        // Regresyon: mesaj kataloğunda nesne dizisi yaprak sanılmıştı; 30 nesne
        // texts'e sızdı, ilk batch'ler faturalandı ve sonraki batch 400 aldı —
        // para gitti, taslak yazılmadı. Girdi artık tek istek atılmadan doğrulanır.
        const translateText = vi.fn()
        const client = { translateText, getUsage: vi.fn() } as unknown as DeepLClient
        const translator = new DeepLTranslator({ apiKey: "k", client })

        await expect(translator.translateTexts({
            texts: ["dolu", "", "  ", "yine dolu"],
            sourceLocale: "tr",
            targetLocale: "de",
        })).rejects.toThrow("2 texts are empty or not strings")

        expect(translateText).not.toHaveBeenCalled()
    })

    it("string olmayan girdiyi de reddeder", () => {
        expect(() => createDeepLRequestBatches(
            ["ok", { title: "nesne" } as unknown as string],
        )).toThrow("Indexes: 1")
    })

    it("rejects a single request that exceeds the safe body size", () => {
        expect(() => createDeepLRequestBatches(
            ["Category"],
            "x".repeat(121 * 1024),
        )).toThrow("too large")
    })

    it("counts Unicode code points for quota estimation", () => {
        expect(estimateTranslationCharacters(["A", "Delta: Δ", "emoji 👍"])).toBe(16)
    })

    it("blocks a request when remaining quota is insufficient", () => {
        expect(() => assertDeepLQuotaAvailable({
            count: 95,
            limit: 100,
            remaining: 5,
        }, 6)).toThrow("quota is insufficient")
    })

    it("uses EN-GB, context, and an optional glossary", async () => {
        const translateText = vi.fn(async (texts: string[]) => texts.map((text) => ({
            text: `${text} translated`,
            detectedSourceLang: "tr" as const,
            billedCharacters: Array.from(text).length,
        })))
        const client = {
            translateText,
            getUsage: vi.fn(),
        } as unknown as DeepLClient
        const translator = new DeepLTranslator({
            apiKey: "test-key",
            glossaryId: "glossary-id",
            client,
        })

        const result = await translator.translateTexts({
            texts: ["Bakalit Tutamaklar"],
            sourceLocale: "tr",
            targetLocale: "en",
            context: "Industrial product category",
        })

        expect(result).toEqual([{
            text: "Bakalit Tutamaklar translated",
            billedCharacters: 18,
        }])
        expect(translateText).toHaveBeenCalledWith(
            ["Bakalit Tutamaklar"],
            "tr",
            "en-GB",
            expect.objectContaining({
                context: "Industrial product category",
                glossary: "glossary-id",
                splitSentences: "off",
            }),
        )
    })

    it("her hedef dil için doğru DeepL kodunu kullanır", async () => {
        // Bölgeli kodlar (pt-BR, zh-HANS) tek haritadan gelir; yanlış kod DeepL
        // tarafında ya reddedilir ya da sessizce başka bir varyanta çevirir.
        const translateText = vi.fn(async (texts: string[]) => texts.map((text) => ({
            text,
            detectedSourceLang: "tr" as const,
            billedCharacters: 1,
        })))
        const client = { translateText, getUsage: vi.fn() } as unknown as DeepLClient
        const translator = new DeepLTranslator({ apiKey: "k", client })

        await translator.translateTexts({ texts: ["x"], sourceLocale: "tr", targetLocale: "pt" })
        expect(translateText).toHaveBeenLastCalledWith(["x"], "tr", "pt-BR", expect.anything())

        await translator.translateTexts({ texts: ["x"], sourceLocale: "tr", targetLocale: "zh" })
        expect(translateText).toHaveBeenLastCalledWith(["x"], "tr", "zh-HANS", expect.anything())
    })

    it("Hintçe'de glossary GÖNDERMEZ", async () => {
        // DeepL'in glossary dil listesi çeviri listesinden dar; hi için
        // glossaryId gönderilirse istek reddedilir.
        const translateText = vi.fn(async (texts: string[]) => texts.map((text) => ({
            text,
            detectedSourceLang: "tr" as const,
            billedCharacters: 1,
        })))
        const client = { translateText, getUsage: vi.fn() } as unknown as DeepLClient
        const translator = new DeepLTranslator({ apiKey: "k", glossaryId: "g", client })

        await translator.translateTexts({ texts: ["x"], sourceLocale: "tr", targetLocale: "hi" })

        expect(translateText).toHaveBeenLastCalledWith(
            ["x"],
            "tr",
            "hi",
            expect.objectContaining({ glossary: undefined }),
        )
    })

    it("geçici hatada yeniden dener ve sonunda başarılı olur", async () => {
        const sleep = vi.fn(async (_ms: number) => {})
        const translateText = vi.fn()
            .mockRejectedValueOnce(new Error("Too many requests (429)"))
            .mockResolvedValueOnce([{ text: "ok", detectedSourceLang: "tr", billedCharacters: 2 }])
        const client = { translateText, getUsage: vi.fn() } as unknown as DeepLClient
        const translator = new DeepLTranslator({ apiKey: "k", client, sleep })

        const result = await translator.translateTexts({
            texts: ["x"],
            sourceLocale: "tr",
            targetLocale: "de",
        })

        expect(result).toEqual([{ text: "ok", billedCharacters: 2 }])
        expect(translateText).toHaveBeenCalledTimes(2)
        expect(sleep).toHaveBeenCalledWith(1_000)
    })

    it("KALICI hatada yeniden denemez", async () => {
        // 400 gibi hatalar tekrarlansa da düzelmez; beklemek yalnız zaman kaybı.
        const sleep = vi.fn(async (_ms: number) => {})
        const getUsage = vi.fn().mockRejectedValue(new Error("Bad request (400): invalid target_lang"))
        const client = { getUsage, translateText: vi.fn() } as unknown as DeepLClient
        const translator = new DeepLTranslator({ apiKey: "k", client, sleep })

        await expect(translator.getUsage()).rejects.toThrow("invalid target_lang")
        expect(getUsage).toHaveBeenCalledTimes(1)
        expect(sleep).not.toHaveBeenCalled()
    })

    it("deneme hakkı bitince hata fırlatır", async () => {
        const sleep = vi.fn(async (_ms: number) => {})
        const getUsage = vi.fn().mockRejectedValue(new Error("503 temporarily unavailable"))
        const client = { getUsage, translateText: vi.fn() } as unknown as DeepLClient
        const translator = new DeepLTranslator({ apiKey: "k", client, sleep, maxAttempts: 3 })

        await expect(translator.getUsage()).rejects.toThrow("temporarily unavailable")
        expect(getUsage).toHaveBeenCalledTimes(3)
        expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([1_000, 2_000])
    })

    it("redacts the API key from DeepL errors", async () => {
        const client = {
            getUsage: vi.fn().mockRejectedValue(new Error("Rejected secret-key")),
        } as unknown as DeepLClient
        const translator = new DeepLTranslator({ apiKey: "secret-key", client })

        await expect(translator.getUsage()).rejects.toThrow("Rejected [redacted]")
    })
})
