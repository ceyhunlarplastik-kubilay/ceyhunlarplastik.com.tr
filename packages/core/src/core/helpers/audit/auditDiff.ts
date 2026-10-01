import type { AuditChange, AuditSnapshot, AuditValue } from "./types"

const isEmpty = (value: AuditValue) =>
    value === null || (Array.isArray(value) && value.length === 0)

const isSameValue = (left: AuditValue, right: AuditValue) => {
    if (isEmpty(left) && isEmpty(right)) return true

    if (Array.isArray(left) && Array.isArray(right)) {
        return left.length === right.length && left.every((item, index) => item === right[index])
    }

    return left === right
}

/**
 * İki snapshot arasındaki alan bazlı fark.
 *
 * `null` snapshot "kayıt yok" demektir: `(null, sonra)` bir CREATE'in, `(önce, null)` bir
 * DELETE'in değişiklik listesini verir. Boş ↔ boş (null, `[]`, hiç olmayan alan) fark
 * SAYILMAZ — yoksa boş bir liste her kayıtta "değişti" görünürdü.
 *
 * Dizi karşılaştırması sıraya duyarlıdır: küme anlamı taşıyan diziyi snapshot'ı üreten
 * taraf sıralar (bkz. `toCategoryAuditSnapshot`).
 *
 * Çıktı sırası deterministiktir: önce `before`'daki alan sırası, sonra yalnız `after`'da
 * olanlar.
 */
export function diffAuditSnapshots(
    before: AuditSnapshot | null,
    after: AuditSnapshot | null,
): AuditChange[] {
    const fields = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
    const changes: AuditChange[] = []

    for (const field of fields) {
        const previous = before?.[field] ?? null
        const next = after?.[field] ?? null

        if (isSameValue(previous, next)) continue

        changes.push({ field, before: previous, after: next })
    }

    return changes
}
