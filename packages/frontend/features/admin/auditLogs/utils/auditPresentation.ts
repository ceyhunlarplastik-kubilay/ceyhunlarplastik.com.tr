import type { AuditAction, AuditChange, AuditLogEntry, AuditValue } from "../api/types"

/**
 * Modele özel sunum: alan yollarını ve id'leri okunur hâle çevirir. Genel zaman tüneli
 * bileşeni hiçbir modeli tanımaz; her model kendi sunucusunu verir
 * (bkz. `categories/utils/categoryAuditPresentation.ts`).
 */
export type AuditPresenter = {
    /** Alan yolunun okunur adı ("translations.en.name" → "Ad (İngilizce)"). */
    fieldLabel: (field: string) => string
    /** Liste alanındaki bir öğenin okunur adı (id → ad). Verilmezse öğe olduğu gibi yazılır. */
    itemLabel?: (field: string, item: string) => string
    /** Olayın bağlamından ek satırlar (silmede kaskadla gidenler gibi). */
    metadataLines?: (entry: AuditLogEntry) => string[]
}

export type AuditChangeView =
    | { kind: "value"; before: string | null; after: string | null }
    | { kind: "list"; added: string[]; removed: string[] }

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
    CREATE: "Oluşturuldu",
    UPDATE: "Güncellendi",
    DELETE: "Silindi",
}

const formatValue = (value: AuditValue): string | null => {
    if (value === null || Array.isArray(value)) return null
    if (typeof value === "boolean") return value ? "Evet" : "Hayır"

    const text = String(value)
    return text === "" ? null : text
}

/**
 * Bir değişikliği gösterime çevirir. Liste alanında (id dizisi) önce/sonra dizilerini
 * yan yana basmak okunmaz; eklenen ve çıkarılan öğeler ayrılır.
 */
export function buildAuditChangeView(change: AuditChange): AuditChangeView {
    if (Array.isArray(change.before) || Array.isArray(change.after)) {
        const before = Array.isArray(change.before) ? change.before : []
        const after = Array.isArray(change.after) ? change.after : []
        const beforeSet = new Set(before)
        const afterSet = new Set(after)

        return {
            kind: "list",
            added: after.filter((item) => !beforeSet.has(item)),
            removed: before.filter((item) => !afterSet.has(item)),
        }
    }

    return {
        kind: "value",
        before: formatValue(change.before),
        after: formatValue(change.after),
    }
}

export function auditActorLabel(actor: AuditLogEntry["actor"]): string {
    if (actor.type === "SYSTEM") return actor.name ? `Sistem (${actor.name})` : "Sistem"

    return actor.name?.trim() || actor.email?.trim() || "Bilinmeyen kullanıcı"
}

const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
})

export function formatAuditDateTime(value: string): string {
    return dateTimeFormatter.format(new Date(value))
}
