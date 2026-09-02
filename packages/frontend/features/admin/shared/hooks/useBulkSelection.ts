"use client"

import { useCallback, useMemo, useState } from "react"

import {
    getVisibleSelectionState,
    toggleSelectionId,
    toggleVisibleSelection,
    type VisibleSelectionState,
} from "@/features/admin/shared/utils/bulkSelection"

export type BulkSelection = {
    selectedIds: ReadonlySet<string>
    selectedCount: number
    isSelected: (id: string) => boolean
    toggle: (id: string) => void
    /** Görünen sayfadaki id'lerin tamamını seç / bırak (diğer sayfa seçimi korunur). */
    toggleVisible: (visibleIds: readonly string[]) => void
    /** Görünen id'lere göre checkbox tri-state. */
    visibleState: (visibleIds: readonly string[]) => VisibleSelectionState
    clear: () => void
    /** Seçimi verilen id kümesiyle değiştirir (ör. toplu silme sonrası engellenenler). */
    replace: (ids: Iterable<string>) => void
}

/**
 * Operasyonel listelerde toplu seçim durumu. Tek kaynak: birden çok admin sayfası
 * (`LeadCustomersPageClient`, `ProductVariantMatrixPageClient`) aynı `Set<string>`
 * + toggle mantığını kopyalıyordu. Saf mantık `utils/bulkSelection.ts`'te ve testli.
 */
export function useBulkSelection(): BulkSelection {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

    const toggle = useCallback(
        (id: string) => setSelectedIds((current) => toggleSelectionId(current, id)),
        [],
    )

    const toggleVisible = useCallback(
        (visibleIds: readonly string[]) =>
            setSelectedIds((current) => toggleVisibleSelection(current, visibleIds)),
        [],
    )

    const clear = useCallback(() => setSelectedIds(new Set()), [])
    const replace = useCallback((ids: Iterable<string>) => setSelectedIds(new Set(ids)), [])

    return useMemo(
        () => ({
            selectedIds,
            selectedCount: selectedIds.size,
            isSelected: (id: string) => selectedIds.has(id),
            toggle,
            toggleVisible,
            visibleState: (visibleIds: readonly string[]) =>
                getVisibleSelectionState(selectedIds, visibleIds),
            clear,
            replace,
        }),
        [selectedIds, toggle, toggleVisible, clear, replace],
    )
}
