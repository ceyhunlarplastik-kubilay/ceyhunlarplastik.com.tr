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
    /**
     * Tekil değerin okunur hâli ("LEAD" → "Potansiyel", "12.5" → "%12,5"). Boş değere
     * çağrılmaz; verilmezse değer olduğu gibi yazılır.
     */
    valueLabel?: (field: string, value: string) => string
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
export function buildAuditChangeView(
    change: AuditChange,
    presenter?: Pick<AuditPresenter, "valueLabel">,
): AuditChangeView {
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

    const label = (value: AuditValue) => {
        const text = formatValue(value)
        return text === null || !presenter?.valueLabel ? text : presenter.valueLabel(change.field, text)
    }

    return {
        kind: "value",
        before: label(change.before),
        after: label(change.after),
    }
}

export function auditActorLabel(actor: AuditLogEntry["actor"]): string {
    if (actor.type === "SYSTEM") return actor.name ? `Sistem (${actor.name})` : "Sistem"
    // Giriş yapmamış kişi (public form): IP ve tarayıcı kaydın künye satırında.
    if (actor.type === "ANONYMOUS") return actor.name ? `Anonim ziyaretçi (${actor.name})` : "Anonim ziyaretçi"

    return actor.name?.trim() || actor.email?.trim() || "Bilinmeyen kullanıcı"
}

const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
})

export function formatAuditDateTime(value: string): string {
    return dateTimeFormatter.format(new Date(value))
}
