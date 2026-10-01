import type { AuditLogEntry } from "@/features/admin/auditLogs/api/types"
import type { AuditPresenter } from "@/features/admin/auditLogs/utils/auditPresentation"
import type { ProductAttribute } from "@/features/admin/productAttributes/api/listAttributesWithValues"
import { adminLocaleLabel } from "@/features/admin/shared/translations/adminLocales"

/**
 * Kategori denetim kayıtlarının sunumu. Alan yolları backend'deki
 * `toCategoryAuditSnapshot` (core/helpers/categories/categoryAudit.ts) ile AYNI olmalı:
 * orada yeni bir alan denetlenmeye başlarsa etiketi buraya eklenir, yoksa ham yol görünür.
 */
const FIELD_LABELS: Record<string, string> = {
    code: "Kod",
    name: "Ad (Türkçe)",
    slug: "Slug (Türkçe)",
    allowedAttributeValueIds: "İzinli attribute değerleri",
}

const TRANSLATION_FIELD = /^translations\.([^.]+)\.(name|slug)$/

export function categoryAuditFieldLabel(field: string): string {
    const known = FIELD_LABELS[field]
    if (known) return known

    const translation = TRANSLATION_FIELD.exec(field)
    if (translation) {
        const [, locale, part] = translation
        return `${part === "name" ? "Ad" : "Slug"} (${adminLocaleLabel(locale)})`
    }

    return field
}

const asRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {}

export function categoryAuditMetadataLines(entry: AuditLogEntry): string[] {
    const metadata = asRecord(entry.metadata)
    const lines: string[] = []

    if (entry.action === "DELETE" && metadata.cascade) {
        const cascade = asRecord(metadata.cascade)
        const productCount = typeof cascade.productCount === "number" ? cascade.productCount : 0
        const assetCount = Array.isArray(cascade.assetKeys) ? cascade.assetKeys.length : 0

        lines.push(`Kategoriyle birlikte silinen: ${productCount} ürün, ${assetCount} görsel`)
    }

    if (typeof metadata.businessRequestId === "string") {
        lines.push("Tedarikçi talebinin onayıyla oluşturuldu")
    }

    return lines
}

/**
 * @param attributes Attribute sözlüğü (id → ad çözümü için). Henüz yüklenmediyse `undefined`:
 *   o sırada id'ler "silinmiş" diye gösterilmez.
 */
export function buildCategoryAuditPresenter(attributes: ProductAttribute[] | undefined): AuditPresenter {
    const valueLabels = attributes
        ? new Map(
            attributes.flatMap((attribute) =>
                attribute.values.map((value) => [value.id, `${attribute.name}: ${value.name}`] as const),
            ),
        )
        : null

    return {
        fieldLabel: categoryAuditFieldLabel,
        itemLabel: (field, item) => {
            if (field !== "allowedAttributeValueIds") return item
            if (!valueLabels) return "…"

            // Kayıt id saklar; değer sonradan silindiyse adı artık çözülemez.
            return valueLabels.get(item) ?? `Silinmiş değer (${item.slice(0, 8)})`
        },
        metadataLines: categoryAuditMetadataLines,
    }
}
