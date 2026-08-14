import { decimalLikeToString, type DecimalLike } from "@/lib/utils/decimal"

/**
 * Kampanya oranı iki yerde tanımlı olabilir: kampanya geneli ve kalem bazlı
 * ezme. Saf, çünkü hem yönetim ekranı hem portal aynı sonucu üretmeli.
 */
export function parseDiscountPercent(value: DecimalLike): number | null {
    if (value === null || value === undefined || value === "") return null

    const parsed = Number(decimalLikeToString(value))
    return Number.isFinite(parsed) ? parsed : null
}

/** Kalem oranı doluysa o, değilse kampanya geneli. */
export function resolveItemDiscountPercent(
    campaignDiscountPercent: DecimalLike,
    itemDiscountPercent: DecimalLike,
): number | null {
    return parseDiscountPercent(itemDiscountPercent) ?? parseDiscountPercent(campaignDiscountPercent)
}

export function formatDiscountPercent(value: number | null): string {
    if (value === null) return "-"
    const text = Number.isInteger(value)
        ? String(value)
        : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
    return `%${text.replace(".", ",")}`
}

export type CampaignValidityState = "SCHEDULED" | "CURRENT" | "EXPIRED"

/** Tarih penceresi durumu; uç değerler null ise sınırsız sayılır. */
export function resolveCampaignValidity(
    validFrom: string | null | undefined,
    validUntil: string | null | undefined,
    now = new Date(),
): CampaignValidityState {
    if (validFrom) {
        const from = new Date(validFrom)
        if (Number.isFinite(from.getTime()) && from > now) return "SCHEDULED"
    }

    if (validUntil) {
        const until = new Date(validUntil)
        if (Number.isFinite(until.getTime()) && until < now) return "EXPIRED"
    }

    return "CURRENT"
}
