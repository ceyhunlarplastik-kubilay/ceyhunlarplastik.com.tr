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

    it("redacts the API key from DeepL errors", async () => {
        const client = {
            getUsage: vi.fn().mockRejectedValue(new Error("Rejected secret-key")),
        } as unknown as DeepLClient
        const translator = new DeepLTranslator({ apiKey: "secret-key", client })

        await expect(translator.getUsage()).rejects.toThrow("Rejected [redacted]")
    })
})
