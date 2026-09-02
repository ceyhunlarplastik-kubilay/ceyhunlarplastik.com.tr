/**
 * Toplu seçim (Set<string>) için saf yardımcılar. `useBulkSelection` bunların
 * ince bir `useState` sarmalayıcısıdır; mantık burada testlenebilir kalır.
 */

export type VisibleSelectionState = "all" | "some" | "none"

/** id seçiliyse çıkarır, değilse ekler. Her zaman YENİ Set döndürür. */
export function toggleSelectionId(current: ReadonlySet<string>, id: string): Set<string> {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
}

/**
 * Görünen (sayfadaki) id'lerin tamamını seçer; hepsi zaten seçiliyse bırakır.
 * Diğer sayfalardan gelen seçimler KORUNUR (çok sayfalı toplu işlem bilinçli).
 */
export function toggleVisibleSelection(
    current: ReadonlySet<string>,
    visibleIds: readonly string[],
): Set<string> {
    const next = new Set(current)
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => next.has(id))
    for (const id of visibleIds) {
        if (allSelected) next.delete(id)
        else next.add(id)
    }
    return next
}

/** Görünen id'lere göre "hepsi / bir kısmı / hiçbiri" — checkbox tri-state için. */
export function getVisibleSelectionState(
    current: ReadonlySet<string>,
    visibleIds: readonly string[],
): VisibleSelectionState {
    if (visibleIds.length === 0) return "none"
    let selected = 0
    for (const id of visibleIds) if (current.has(id)) selected += 1
    if (selected === 0) return "none"
    if (selected === visibleIds.length) return "all"
    return "some"
}

/**
 * Onay diyaloğunda listelenecek adlar. Seçim sayfa değişince korunduğu için
 * görünen sayfada olmayan bir kaydın adı elde olmayabilir — o zaman id'ye düşülür
 * (kullanıcı yine kaç kaydın gideceğini ve bulunanların adını görür).
 */
export function resolveSelectedNames(
    selectedIds: ReadonlySet<string>,
    nameById: ReadonlyMap<string, string>,
): string[] {
    return [...selectedIds].map((id) => nameById.get(id) ?? id)
}
