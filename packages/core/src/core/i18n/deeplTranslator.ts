import {
    DeepLClient,
    type SourceLanguageCode,
    type TargetLanguageCode,
} from "deepl-node"

import type { SupportedLocale } from "./locales"
import { countUnicodeCharacters } from "./translationDraft"

export const DEEPL_MAX_TEXTS_PER_REQUEST = 50
export const DEEPL_SAFE_REQUEST_BYTES = 120 * 1024

const SOURCE_LANGUAGE_BY_LOCALE: Record<SupportedLocale, SourceLanguageCode> = {
    tr: "tr",
    en: "en",
}

const TARGET_LANGUAGE_BY_LOCALE: Record<SupportedLocale, TargetLanguageCode> = {
    tr: "tr",
    en: "en-GB",
}

export type DeepLUsage = {
    count: number
    limit: number
    remaining: number
} | null

export type DeepLTranslation = {
    text: string
    billedCharacters: number
}

export class DeepLTranslationError extends Error {}

function estimateRequestBytes(texts: string[], context?: string) {
    return Buffer.byteLength(JSON.stringify({
        text: texts,
        source_lang: "TR",
        target_lang: "EN-GB",
        context,
    }))
}

export function createDeepLRequestBatches(texts: string[], context?: string) {
    const batches: string[][] = []
    let current: string[] = []

    for (const text of texts) {
        const candidate = [...current, text]
        const exceedsCount = candidate.length > DEEPL_MAX_TEXTS_PER_REQUEST
        const exceedsBytes = estimateRequestBytes(candidate, context) > DEEPL_SAFE_REQUEST_BYTES

        if ((exceedsCount || exceedsBytes) && current.length > 0) {
            batches.push(current)
            current = [text]
        } else {
            current = candidate
        }

        if (estimateRequestBytes(current, context) > DEEPL_SAFE_REQUEST_BYTES) {
            throw new DeepLTranslationError(
                "A translation text is too large for a DeepL text request",
            )
        }
    }

    if (current.length > 0) batches.push(current)
    return batches
}

export function estimateTranslationCharacters(texts: string[]) {
    return texts.reduce((total, text) => total + countUnicodeCharacters(text), 0)
}

export function assertDeepLQuotaAvailable(usage: DeepLUsage, requiredCharacters: number) {
    if (usage && requiredCharacters > usage.remaining) {
        throw new DeepLTranslationError(
            `DeepL quota is insufficient: ${requiredCharacters} required, ${usage.remaining} remaining`,
        )
    }
}

export class DeepLTranslator {
    private readonly apiKey: string
    private readonly client: DeepLClient
    private readonly glossaryId?: string

    constructor({
        apiKey,
        glossaryId,
        client,
    }: {
        apiKey: string
        glossaryId?: string
        client?: DeepLClient
    }) {
        const normalizedApiKey = apiKey.trim()
        if (!normalizedApiKey) {
            throw new DeepLTranslationError("DEEPL_API_KEY is required")
        }

        this.apiKey = normalizedApiKey
        this.glossaryId = glossaryId?.trim() || undefined
        this.client = client ?? new DeepLClient(normalizedApiKey)
    }

    async getUsage(): Promise<DeepLUsage> {
        return this.runSafely(async () => {
            const usage = await this.client.getUsage()
            if (!usage.character) return null

            return {
                count: usage.character.count,
                limit: usage.character.limit,
                remaining: Math.max(usage.character.limit - usage.character.count, 0),
            }
        })
    }

    async translateTexts({
        texts,
        sourceLocale,
        targetLocale,
        context,
    }: {
        texts: string[]
        sourceLocale: SupportedLocale
        targetLocale: SupportedLocale
        context?: string
    }): Promise<DeepLTranslation[]> {
        if (sourceLocale === targetLocale) {
            throw new DeepLTranslationError("Source and target locales must be different")
        }

        const batches = createDeepLRequestBatches(texts, context)
        const translations: DeepLTranslation[] = []

        for (const batch of batches) {
            const results = await this.runSafely(() => this.client.translateText(
                batch,
                SOURCE_LANGUAGE_BY_LOCALE[sourceLocale],
                TARGET_LANGUAGE_BY_LOCALE[targetLocale],
                {
                    context,
                    glossary: this.glossaryId,
                    preserveFormatting: true,
                    splitSentences: "off",
                },
            ))

            if (results.length !== batch.length) {
                throw new DeepLTranslationError(
                    `DeepL returned ${results.length} translations for ${batch.length} texts`,
                )
            }

            translations.push(...results.map((result) => ({
                text: result.text,
                billedCharacters: result.billedCharacters,
            })))
        }

        return translations
    }

    private async runSafely<T>(operation: () => Promise<T>): Promise<T> {
        try {
            return await operation()
        } catch (error) {
            if (error instanceof DeepLTranslationError) throw error

            const message = error instanceof Error ? error.message : "Unknown DeepL error"
            const redactedMessage = message.split(this.apiKey).join("[redacted]")
            throw new DeepLTranslationError(`DeepL request failed: ${redactedMessage}`)
        }
    }
}
