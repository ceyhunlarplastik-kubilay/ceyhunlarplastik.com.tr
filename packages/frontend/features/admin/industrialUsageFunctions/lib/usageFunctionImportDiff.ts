import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from "@core/i18n/locales"
import type {
    IndustrialUsageFunctionsPayload,
    UsageFunctionLocaleMap,
} from "@/features/admin/industrialUsageFunctions/api/types"
import { ADMIN_LOCALE_LABELS } from "@/features/admin/shared/translations/adminLocales"
import { USAGE_FUNCTION_MAX_LENGTH } from "./usageFunctionWorkbookFormat"

/**
 * Excel'den okunan ham satırları, sunucudaki güncel duruma karşı karşılaştırır.
 *
 * Buradaki doğrulama kullanıcıya ÖNİZLEME üretmek içindir; son söz backend'in
 * (`buildIndustrialUsageFunctionWritePlan`) — istemciye güvenilmez. Yine de iki
 * taraf aynı kuralları uygular, böylece kullanıcı hatayı yüklemeden önce görür.
 */

export type ParsedUsageFunctionRow = {
    /** Excel'deki fiziksel satır numarası — hata mesajı kullanıcıyı oraya yollar. */
    excelRow: number
    usageId: string
    /** Sütun başlığından dili çözülen hücreler; boş hücreler zaten taşınmaz. */
    usageFunctions: UsageFunctionLocaleMap
}

export type ParsedUsageFunctionWorkbook = {
    sheetName: string
    productId: string | null
    productCode: string | null
    /** Başlıktan dili çözülen sütunlar. */
    locales: SupportedLocale[]
    /** Dili çözülemeyen, veri taşıyan sütun başlıkları — uyarı üretir. */
    unreadableColumns: string[]
    rows: ParsedUsageFunctionRow[]
}

export type UsageFunctionChange = {
    usageId: string
    locale: SupportedLocale
    excelRow: number
    previous: string | null
    next: string
    kind: "created" | "updated"
}

export type UsageFunctionLocaleSummary = {
    locale: SupportedLocale
    created: number
    updated: number
    unchanged: number
}

export type UsageFunctionImportDiff = {
    errors: string[]
    warnings: string[]
    changes: UsageFunctionChange[]
    localeSummaries: UsageFunctionLocaleSummary[]
    touchedRows: number
    unchanged: number
    /** Backend'e gönderilecek gövde: yalnız DEĞİŞEN hücreler. */
    rows: Array<{ usageId: string; usageFunctions: UsageFunctionLocaleMap }>
}

function normalizeText(value: string | null | undefined) {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
}

function emptyDiff(errors: string[], warnings: string[]): UsageFunctionImportDiff {
    return {
        errors,
        warnings,
        changes: [],
        localeSummaries: [],
        touchedRows: 0,
        unchanged: 0,
        rows: [],
    }
}

export function buildUsageFunctionImportDiff({
    parsed,
    current,
}: {
    parsed: ParsedUsageFunctionWorkbook
    current: IndustrialUsageFunctionsPayload
}): UsageFunctionImportDiff {
    const errors: string[] = []
    const warnings: string[] = []
    const changes: UsageFunctionChange[] = []

    if (parsed.unreadableColumns.length > 0) {
        warnings.push(
            `Dil kodu okunamayan ${parsed.unreadableColumns.length} sütun atlandı: ${parsed.unreadableColumns.join(", ")}`,
        )
    }

    if (parsed.locales.length === 0) {
        return emptyDiff(
            [
                "Dosyada tanınan bir dil sütunu yok. Dışa aktarma ile üretilmiş bir dosya yükleyin.",
            ],
            warnings,
        )
    }

    // Kimlik doğrulaması: dosya BAŞKA bir ürüne aitse hiçbir şey yazılmamalı.
    if (!parsed.productId) {
        return emptyDiff(
            [
                "Dosyanın üst bloğunda Ürün ID bulunamadı. Bilgi satırları silinmiş veya değiştirilmiş olabilir.",
            ],
            warnings,
        )
    }

    if (parsed.productId !== current.product.id) {
        return emptyDiff(
            [
                `Bu dosya başka bir ürüne ait (dosyadaki ürün: ${parsed.productCode ?? parsed.productId}). Seçili ürün: ${current.product.code} — ${current.product.name}.`,
            ],
            warnings,
        )
    }

    const currentRows = new Map(current.rows.map((row) => [row.usageId, row]))
    const summaries = new Map<SupportedLocale, UsageFunctionLocaleSummary>()
    const pending = new Map<string, UsageFunctionLocaleMap>()
    const seenUsageIds = new Set<string>()

    let unchanged = 0

    const localeSummary = (locale: SupportedLocale) => {
        const existing = summaries.get(locale)
        if (existing) return existing

        const created = { locale, created: 0, updated: 0, unchanged: 0 }
        summaries.set(locale, created)
        return created
    }

    for (const row of parsed.rows) {
        const usageId = row.usageId.trim()
        // Boş hücreler veriyi SİLMEZ — yarım doldurulmuş dosya güvenle yüklenir.
        const filledLocales = SUPPORTED_LOCALES.filter((locale) =>
            normalizeText(row.usageFunctions[locale]),
        )

        if (filledLocales.length === 0) continue

        if (!usageId) {
            errors.push(
                `Satır ${row.excelRow}: metin var ama "Kullanım Satırı ID" boş.`,
            )
            continue
        }

        if (seenUsageIds.has(usageId)) {
            errors.push(
                `Satır ${row.excelRow}: aynı kullanım satırı dosyada birden fazla kez var.`,
            )
            continue
        }
        seenUsageIds.add(usageId)

        const currentRow = currentRows.get(usageId)
        if (!currentRow) {
            errors.push(
                `Satır ${row.excelRow}: bu kullanım satırı üründe bulunamadı (silinmiş olabilir). ID: ${usageId}`,
            )
            continue
        }

        for (const locale of filledLocales) {
            const text = normalizeText(row.usageFunctions[locale])
            if (!text) continue

            if (text.length > USAGE_FUNCTION_MAX_LENGTH) {
                errors.push(
                    `Satır ${row.excelRow} · ${ADMIN_LOCALE_LABELS[locale]}: metin ${USAGE_FUNCTION_MAX_LENGTH} karakter sınırını aşıyor (${text.length}).`,
                )
                continue
            }

            const previous = currentRow.usageFunctions[locale] ?? null

            if (previous === text) {
                unchanged += 1
                localeSummary(locale).unchanged += 1
                continue
            }

            const entry = pending.get(usageId) ?? {}
            entry[locale] = text
            pending.set(usageId, entry)

            const summary = localeSummary(locale)
            if (previous) summary.updated += 1
            else summary.created += 1

            changes.push({
                usageId,
                locale,
                excelRow: row.excelRow,
                previous,
                next: text,
                kind: previous ? "updated" : "created",
            })
        }
    }

    // Backend kuralı: TR metni olmadan hedef dil yazılamaz. Kullanıcı bunu
    // yüklemeden önce görmeli, 400 olarak değil.
    for (const [usageId, usageFunctions] of pending) {
        const hasIncomingDefault = Boolean(normalizeText(usageFunctions[DEFAULT_LOCALE]))
        const hasStoredDefault = Boolean(
            normalizeText(currentRows.get(usageId)?.usageFunctions[DEFAULT_LOCALE]),
        )
        if (hasIncomingDefault || hasStoredDefault) continue

        const targetLocales = Object.keys(usageFunctions).filter(
            (locale) => locale !== DEFAULT_LOCALE,
        )
        if (targetLocales.length === 0) continue

        errors.push(
            `Kullanım satırı ${usageId}: Türkçe sütunu doldurulmadan çeviri kaydedilemez (dolu diller: ${targetLocales.join(", ")}).`,
        )
    }

    const rows = [...pending.entries()].map(([usageId, usageFunctions]) => ({
        usageId,
        usageFunctions,
    }))

    return {
        errors,
        warnings,
        changes,
        localeSummaries: [...summaries.values()],
        touchedRows: rows.length,
        unchanged,
        rows: errors.length > 0 ? [] : rows,
    }
}
