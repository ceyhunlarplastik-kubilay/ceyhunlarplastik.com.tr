/**
 * Duruş ve fire NEDENLERİ — SAF modül (yalnız göreli import; frontend de okuyabilir).
 *
 *  - Tek sözlük, iki tür: duruş (STOP, kategoriyle) ve fire (SCRAP, kategorisiz).
 *  - Kod tür içinde tekildir; büyük harf ASCII (D01, F03, KALIP-AYAR).
 *  - Kullanılan neden silinmez (vardiya raporu ona bağlı) — pasife alınır; pasif neden yeni
 *    raporda seçilemez, eski raporda kalır.
 *  - Duruş kategorisi istatistikte kayıp türünü ayırır: PLANNED (mola, planlı bakım, renk / kalıp
 *    değişimi) kullanılabilirlik kaybı sayılmaz.
 */

export type ProductionReasonKind = "STOP" | "SCRAP"
export type ProductionStopCategory = "PLANNED" | "BREAKDOWN" | "MATERIAL" | "QUALITY" | "PERSONNEL" | "OTHER"

export const REASON_KIND_LABELS: Record<ProductionReasonKind, string> = { STOP: "Duruş", SCRAP: "Fire" }

export const STOP_CATEGORIES: ProductionStopCategory[] = ["PLANNED", "BREAKDOWN", "MATERIAL", "QUALITY", "PERSONNEL", "OTHER"]

export const STOP_CATEGORY_LABELS: Record<ProductionStopCategory, string> = {
    PLANNED: "Planlı",
    BREAKDOWN: "Arıza",
    MATERIAL: "Malzeme",
    QUALITY: "Kalite / ayar",
    PERSONNEL: "Personel",
    OTHER: "Diğer",
}

export const REASON_CODE_PATTERN = /^[A-Z0-9][A-Z0-9._-]{0,19}$/
export const MAX_REASON_NAME_LENGTH = 80

/** "d01 " → "D01" (ASCII büyük harf; Türkçe "i" → "I"). */
export function normalizeReasonCode(code: string): string {
    return code.trim().toUpperCase()
}

export type ReasonInput = { kind: ProductionReasonKind; code: string; name: string; stopCategory: ProductionStopCategory | null }

export function findReasonIssues(input: ReasonInput): Array<{ field: "code" | "name" | "stopCategory"; message: string }> {
    const issues: Array<{ field: "code" | "name" | "stopCategory"; message: string }> = []
    if (!REASON_CODE_PATTERN.test(normalizeReasonCode(input.code))) {
        issues.push({ field: "code", message: "Kod harf / rakamla başlamalı; yalnız A-Z, 0-9, nokta, tire ve alt çizgi (en çok 20)." })
    }
    const name = input.name.trim()
    if (!name) issues.push({ field: "name", message: "Ad boş olamaz." })
    else if (name.length > MAX_REASON_NAME_LENGTH) issues.push({ field: "name", message: `Ad en fazla ${MAX_REASON_NAME_LENGTH} karakter olabilir.` })
    if (input.kind === "STOP" && !input.stopCategory) issues.push({ field: "stopCategory", message: "Duruş nedeninin kategorisi seçilmeli." })
    if (input.kind === "SCRAP" && input.stopCategory) issues.push({ field: "stopCategory", message: "Fire nedeninde kategori olmaz." })
    return issues
}

type DefaultReason = { kind: ProductionReasonKind; code: string; name: string; stopCategory: ProductionStopCategory | null }

/** "Varsayılanları ekle" listesi — enjeksiyon kalıplamada yaygın nedenler. */
export const DEFAULT_PRODUCTION_REASONS: DefaultReason[] = [
    { kind: "STOP", code: "D01", name: "Kalıp arızası", stopCategory: "BREAKDOWN" },
    { kind: "STOP", code: "D02", name: "Makine arızası", stopCategory: "BREAKDOWN" },
    { kind: "STOP", code: "D03", name: "Robot / çevre birimi arızası", stopCategory: "BREAKDOWN" },
    { kind: "STOP", code: "D04", name: "Malzeme bekleme", stopCategory: "MATERIAL" },
    { kind: "STOP", code: "D05", name: "Hammadde kurutma", stopCategory: "MATERIAL" },
    { kind: "STOP", code: "D06", name: "Renk değişimi", stopCategory: "PLANNED" },
    { kind: "STOP", code: "D07", name: "Kalıp değişimi / ayar", stopCategory: "PLANNED" },
    { kind: "STOP", code: "D08", name: "Planlı bakım", stopCategory: "PLANNED" },
    { kind: "STOP", code: "D09", name: "Mola / yemek", stopCategory: "PLANNED" },
    { kind: "STOP", code: "D10", name: "Kalite ayarı / deneme baskı", stopCategory: "QUALITY" },
    { kind: "STOP", code: "D11", name: "Operatör yok", stopCategory: "PERSONNEL" },
    { kind: "STOP", code: "D12", name: "Elektrik / hava / su kesintisi", stopCategory: "OTHER" },
    { kind: "SCRAP", code: "F01", name: "Çapak", stopCategory: null },
    { kind: "SCRAP", code: "F02", name: "Eksik baskı", stopCategory: null },
    { kind: "SCRAP", code: "F03", name: "Yanık / gaz izi", stopCategory: null },
    { kind: "SCRAP", code: "F04", name: "Çöküntü", stopCategory: null },
    { kind: "SCRAP", code: "F05", name: "Renk farkı / leke", stopCategory: null },
    { kind: "SCRAP", code: "F06", name: "Ölçü dışı", stopCategory: null },
    { kind: "SCRAP", code: "F07", name: "Çarpılma", stopCategory: null },
    { kind: "SCRAP", code: "F08", name: "Kontaminasyon / yabancı madde", stopCategory: null },
    { kind: "SCRAP", code: "F09", name: "İlk baskı / ayar firesi", stopCategory: null },
    { kind: "SCRAP", code: "F10", name: "Kırık / çatlak", stopCategory: null },
]

/** Sözlükte (tür + kod) henüz olmayan varsayılanlar; sıra listedeki konumdan. */
export function missingDefaultReasons(existing: Array<{ kind: ProductionReasonKind; code: string }>) {
    const keys = new Set(existing.map((reason) => `${reason.kind}|${reason.code}`))
    return DEFAULT_PRODUCTION_REASONS
        .map((reason, index) => ({ ...reason, sortOrder: index }))
        .filter((reason) => !keys.has(`${reason.kind}|${reason.code}`))
}
