/**
 * Üretim canlı güncellemesi (4.4) — mesaj sözleşmesinin TEK KAYNAĞI: üretim yazma uçları yayınlar,
 * `/uretim` paneli ayrıştırır. SAF modül, import yok (frontend `@core/*` ile okur).
 *
 * Mesaj yalnız "şu alan değişti" ipucudur; veri taşımaz. İstemci ilgili sorguları geçersiz kılar ve
 * veriyi her zamanki API'den (yetki kurallarıyla) yeniden çeker.
 */

/**
 * Değişen alan:
 *  - `plan`: emirler, planlama / taşıma / iptal, iş durumu, lot başlatma / rapor (tahta, pano, lotlar,
 *    kalıp sayacı)
 *  - `roster`: vardiya ekibi
 *  - `lots`: lot notu / lota özel ekip
 *  - `reasons`: duruş / fire nedenleri
 *  - `definitions`: makine, kalıp, alan, vardiya düzeni, takvim, duruş, operatör, hammadde bilgisi
 */
export const PRODUCTION_CHANGE_SCOPES = ["plan", "roster", "lots", "reasons", "definitions"] as const

export type ProductionChangeScope = (typeof PRODUCTION_CHANGE_SCOPES)[number]

export const PRODUCTION_CHANGE_MESSAGE_TYPE = "production.changed"

export const PRODUCTION_CHANGE_SCOPE_LABELS: Record<ProductionChangeScope, string> = {
    plan: "Plan / saha",
    roster: "Vardiya ekibi",
    lots: "Lot notu / ekibi",
    reasons: "Duruş / fire nedenleri",
    definitions: "Tanımlar",
}

export type ProductionChangeMessage = {
    type: typeof PRODUCTION_CHANGE_MESSAGE_TYPE
    scopes: ProductionChangeScope[]
    /** ISO zaman damgası. */
    occurredAt: string
    /** Değişikliği yapan kullanıcının (DB) kimliği; bilinmiyorsa `null`. */
    actorUserId: string | null
}

function isScope(value: unknown): value is ProductionChangeScope {
    return typeof value === "string" && (PRODUCTION_CHANGE_SCOPES as readonly string[]).includes(value)
}

export function buildProductionChangeMessage(input: {
    scopes: ProductionChangeScope[]
    actorUserId: string | null
    occurredAt: Date
}): ProductionChangeMessage {
    return {
        type: PRODUCTION_CHANGE_MESSAGE_TYPE,
        scopes: [...new Set(input.scopes)],
        occurredAt: input.occurredAt.toISOString(),
        actorUserId: input.actorUserId,
    }
}

/**
 * Gelen mesajı doğrular. Bilinmeyen alanlar düşer (yeni sürümle gelen bir alanı eski istemci
 * tanımıyorsa geri kalanı yine işler); tanınan alan yoksa ya da biçim bozuksa `null`.
 */
export function parseProductionChangeMessage(raw: string): ProductionChangeMessage | null {
    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch {
        return null
    }
    if (!parsed || typeof parsed !== "object") return null
    const candidate = parsed as Record<string, unknown>
    if (candidate.type !== PRODUCTION_CHANGE_MESSAGE_TYPE || !Array.isArray(candidate.scopes)) return null
    if (typeof candidate.occurredAt !== "string" || Number.isNaN(Date.parse(candidate.occurredAt))) return null

    const scopes = [...new Set(candidate.scopes.filter(isScope))]
    if (scopes.length === 0) return null
    return {
        type: PRODUCTION_CHANGE_MESSAGE_TYPE,
        scopes,
        occurredAt: candidate.occurredAt,
        actorUserId: typeof candidate.actorUserId === "string" && candidate.actorUserId ? candidate.actorUserId : null,
    }
}
