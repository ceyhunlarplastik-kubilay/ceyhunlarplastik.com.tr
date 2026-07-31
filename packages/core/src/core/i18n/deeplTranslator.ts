import { DeepLClient } from "deepl-node"

import {
    getDeepLSourceLanguage,
    getDeepLTargetLanguage,
    supportsGlossary,
} from "./deeplLanguages"
import type { SupportedLocale } from "./locales"
import { countUnicodeCharacters } from "./translationDraft"

export const DEEPL_MAX_TEXTS_PER_REQUEST = 50
export const DEEPL_SAFE_REQUEST_BYTES = 120 * 1024

/**
 * Geçici hatalarda yeniden deneme. 13 hedef dile açıldığımızda istek hacmi
 * ~13× artıyor; tek bir 429 bütün taslak üretimini (ve o ana kadar harcanan
 * karakter kotasını) çöpe atardı. Yalnız GEÇİCİ görünen hatalar tekrarlanır —
 * kota yetersizliği veya geçersiz dil kodu tekrarlanırsa boşuna beklenir.
 */
export const DEEPL_MAX_ATTEMPTS = 4
export const DEEPL_RETRY_BASE_DELAY_MS = 1_000

const RETRYABLE_MESSAGE_PATTERNS = [
    /\b429\b/,
    /too many requests/i,
    /rate limit/i,
    /\b5\d{2}\b/,
    /temporarily unavailable/i,
    /timeout/i,
    /ETIMEDOUT/i,
    /ECONNRESET/i,
    /EAI_AGAIN/i,
    /socket hang up/i,
]

export function isRetryableDeepLError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return RETRYABLE_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))
}

/** Üstel geri çekilme: 1s, 2s, 4s … (deneme sırası 1'den başlar). */
export function deepLRetryDelayMs(attempt: number) {
    return DEEPL_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)
}

export { supportsGlossary }

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

/**
 * Toplu isteğe girmeden ÖNCE her metnin dolu bir string olduğunu doğrular.
 *
 * NEDEN ÖNCEDEN: batch'ler sırayla gönderiliyor ve DeepL geçersiz bir metni
 * ancak o batch'e gelince reddediyor. Bir kez, mesaj kataloğunda nesne dizisi
 * yaprak sanıldığı için 30 nesne texts'e sızdı; ilk batch'ler faturalandı,
 * sonraki batch 400 aldı ve taslak hiç yazılmadı — para gitti, çıktı yok.
 * Girdi doğrulaması tek bir ağ isteği atılmadan yapılır.
 */
export function assertTranslatableTexts(texts: unknown[]) {
    const invalid = texts.flatMap((text, index) =>
        typeof text === "string" && text.trim() !== "" ? [] : [index],
    )

    if (invalid.length > 0) {
        const preview = invalid.slice(0, 10).join(", ")
        const suffix = invalid.length > 10 ? `, … (+${invalid.length - 10})` : ""
        throw new DeepLTranslationError(
            `${invalid.length} texts are empty or not strings; DeepL rejects them. Indexes: ${preview}${suffix}`,
        )
    }
}

export function createDeepLRequestBatches(texts: string[], context?: string) {
    assertTranslatableTexts(texts)

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
    private readonly maxAttempts: number
    private readonly sleep: (ms: number) => Promise<void>

    constructor({
        apiKey,
        glossaryId,
        client,
        maxAttempts = DEEPL_MAX_ATTEMPTS,
        sleep,
    }: {
        apiKey: string
        glossaryId?: string
        client?: DeepLClient
        /** Testlerde 1'e çekilerek retry kapatılabilir. */
        maxAttempts?: number
        /** Testlerin gerçekten beklememesi için enjekte edilebilir. */
        sleep?: (ms: number) => Promise<void>
    }) {
        const normalizedApiKey = apiKey.trim()
        if (!normalizedApiKey) {
            throw new DeepLTranslationError("DEEPL_API_KEY is required")
        }

        this.apiKey = normalizedApiKey
        this.glossaryId = glossaryId?.trim() || undefined
        this.client = client ?? new DeepLClient(normalizedApiKey)
        this.maxAttempts = Math.max(1, maxAttempts)
        this.sleep = sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)))
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
        // Glossary dil çiftine bağlı; desteklenmeyen hedefte gönderilirse DeepL
        // isteği reddeder (ör. Hintçe).
        const glossary = supportsGlossary(targetLocale) ? this.glossaryId : undefined

        for (const batch of batches) {
            const results = await this.runSafely(() => this.client.translateText(
                batch,
                getDeepLSourceLanguage(sourceLocale),
                getDeepLTargetLanguage(targetLocale),
                {
                    context,
                    glossary,
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
        let lastError: unknown

        for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
            try {
                return await operation()
            } catch (error) {
                // Kendi doğrulama hatalarımız (kota, tutarsız yanıt) tekrarlanmaz.
                if (error instanceof DeepLTranslationError) throw error

                lastError = error
                const canRetry = attempt < this.maxAttempts && isRetryableDeepLError(error)
                if (!canRetry) break

                await this.sleep(deepLRetryDelayMs(attempt))
            }
        }

        const message = lastError instanceof Error ? lastError.message : "Unknown DeepL error"
        const redactedMessage = message.split(this.apiKey).join("[redacted]")
        throw new DeepLTranslationError(`DeepL request failed: ${redactedMessage}`)
    }
}
