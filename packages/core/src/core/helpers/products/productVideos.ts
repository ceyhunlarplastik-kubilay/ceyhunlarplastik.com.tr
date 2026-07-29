import createError from "http-errors"

import { normalizeYoutubeUrl } from "./youtubeVideo"

/**
 * Ürün video linklerinin API sınırındaki normalizasyonu.
 * `normalizeProductIndustrialUsages` ile aynı desen: handler ham body'yi verir,
 * helper doğrulanmış/normalize edilmiş Prisma alanlarını döndürür.
 */

export type ProductVideoUrlsInput = {
    assemblyVideoUrl?: string | null
    promoVideoUrl?: string | null
}

export type NormalizedProductVideoUrls = {
    assemblyVideoUrl?: string | null
    promoVideoUrl?: string | null
}

/**
 * - `undefined` → `undefined` (update'te "bu alana dokunma")
 * - boş/whitespace → `null` (alanı temizle)
 * - dolu → kanonik watch URL'i; ayrıştırılamıyorsa 400
 */
function normalizeProductVideoUrl(
    value: string | null | undefined,
    fieldLabel: string,
): string | null | undefined {
    if (value === undefined) return undefined

    const trimmed = value?.trim()
    if (!trimmed) return null

    const normalized = normalizeYoutubeUrl(trimmed)
    if (!normalized) {
        throw new createError.BadRequest(`${fieldLabel} must be a valid YouTube video URL`)
    }

    return normalized
}

export function normalizeProductVideoUrls(
    input: ProductVideoUrlsInput,
): NormalizedProductVideoUrls {
    return {
        assemblyVideoUrl: normalizeProductVideoUrl(input.assemblyVideoUrl, "assemblyVideoUrl"),
        promoVideoUrl: normalizeProductVideoUrl(input.promoVideoUrl, "promoVideoUrl"),
    }
}
