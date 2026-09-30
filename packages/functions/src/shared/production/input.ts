import createError from "http-errors"

/**
 * Üretim planlama handler'larının ortak girdi yardımcıları.
 *
 * İstek şemasındaki `.trim()` JSON Schema'ya çevrilemediği için ajv yalnız ham
 * uzunluğu denetler: "   " geçer. Kırpma ve "boş mu" kontrolü burada yapılır.
 */

/** Zorunlu metin: kırpılır, boş kalırsa 400. */
export function requireText(value: string, label: string): string {
    const trimmed = value.trim()
    if (!trimmed) throw new createError.BadRequest(`${label} boş olamaz.`)
    return trimmed
}

/**
 * Opsiyonel metin — PATCH anlamı korunur: `undefined` → dokunma, `null` veya boş
 * metin → `null` (temizle), aksi hâlde kırpılmış değer.
 */
export function optionalText(value: string | null | undefined): string | null | undefined {
    if (value === undefined) return undefined
    if (value === null) return null
    const trimmed = value.trim()
    return trimmed ? trimmed : null
}

/** `undefined` değerli anahtarları atar — Prisma `update`'e yalnız gönderilen alanlar gitsin. */
export function withoutUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(value).filter(([, entry]) => entry !== undefined),
    ) as Partial<T>
}
