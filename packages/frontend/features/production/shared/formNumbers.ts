import { z } from "zod"

/**
 * Sayı alanları formda METİN olarak tutulur (boş bırakılabilsin, "12,5" yazılabilsin)
 * ve şema çıktısında sayıya çevrilir. Bu yardımcılar yalnız TARAYICIDA çalışır;
 * sunucu tarafında aynı sınırlar istek validator'ında var.
 */

type Range = { min: number; max: number }

const INTEGER_PATTERN = /^\d+$/
const DECIMAL_PATTERN = /^\d+([.,]\d+)?$/

function toDecimal(value: string) {
    return Number(value.replace(",", "."))
}

function rangeMessage(label: string, { min, max }: Range) {
    return `${label} ${min.toLocaleString("tr-TR")}–${max.toLocaleString("tr-TR")} arasında olmalı`
}

/** Zorunlu tam sayı: "120" → 120. */
export function requiredIntegerField(label: string, range: Range) {
    return z.string()
        .trim()
        .min(1, `${label} zorunlu`)
        .refine((value) => INTEGER_PATTERN.test(value), `${label} tam sayı olmalı`)
        .transform(Number)
        .refine((value) => value >= range.min && value <= range.max, rangeMessage(label, range))
}

/** Zorunlu ondalık sayı ("22,5" de kabul). */
export function requiredDecimalField(label: string, range: Range) {
    return z.string()
        .trim()
        .min(1, `${label} zorunlu`)
        .refine((value) => DECIMAL_PATTERN.test(value), `${label} sayı olmalı`)
        .transform(toDecimal)
        .refine((value) => value >= range.min && value <= range.max, rangeMessage(label, range))
}

/** Boş bırakılabilen tam sayı: "" → null. */
export function optionalIntegerField(label: string, range: Range) {
    return z.string()
        .trim()
        .refine((value) => value === "" || INTEGER_PATTERN.test(value), `${label} tam sayı olmalı`)
        .transform((value) => (value === "" ? null : Number(value)))
        .refine((value) => value === null || (value >= range.min && value <= range.max), rangeMessage(label, range))
}

/** Boş bırakılabilen ondalık sayı ("12,5" de kabul): "" → null. */
export function optionalDecimalField(label: string, range: Range) {
    return z.string()
        .trim()
        .refine((value) => value === "" || DECIMAL_PATTERN.test(value), `${label} sayı olmalı`)
        .transform((value) => (value === "" ? null : toDecimal(value)))
        .refine((value) => value === null || (value >= range.min && value <= range.max), rangeMessage(label, range))
}

/** Sayı → form metni: null/undefined → "". */
export function toFieldText(value: number | null | undefined): string {
    return value === null || value === undefined ? "" : String(value).replace(".", ",")
}
