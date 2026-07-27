export type PaginationItem = number | "ellipsis-left" | "ellipsis-right"

const range = (start: number, end: number): number[] =>
    Array.from({ length: Math.max(end - start + 1, 0) }, (_, index) => start + index)

/**
 * Pencereli sayfalama öğelerini üretir: ilk sayfa, son sayfa, mevcut sayfanın komşuları ve
 * aradaki boşluklar için "…" işaretleri.
 *
 * Önceki hal tüm sayfaları yan yana basıyordu (76 ürün / 20 = 4 sayfa iken sorun değil ama
 * katalog büyüdükçe onlarca buton). Profesyonel katalogların deseni: 1 … 4 [5] 6 … 20
 *
 * @param siblingCount mevcut sayfanın her iki yanında gösterilecek komşu sayısı
 */
export function getPaginationItems(
    page: number,
    totalPages: number,
    siblingCount = 1,
): PaginationItem[] {
    if (totalPages <= 0) return []

    const currentPage = Math.min(Math.max(page, 1), totalPages)

    // ilk + son + mevcut + iki yan komşu grubu + iki "…" yeri
    const totalSlots = siblingCount * 2 + 5

    // Tüm sayfalar zaten sığıyorsa kısaltmaya gerek yok.
    if (totalPages <= totalSlots) return range(1, totalPages)

    const left = Math.max(currentPage - siblingCount, 1)
    const right = Math.min(currentPage + siblingCount, totalPages)

    // "…" yalnız gerçekten atlanan sayfa varsa gösterilir (tek sayfa atlanacaksa
    // "…" yerine sayfanın kendisi görünür — aşağıdaki blok sınırları buna göre seçilir).
    const showLeftEllipsis = left > 2
    const showRightEllipsis = right < totalPages - 1

    if (!showLeftEllipsis && showRightEllipsis) {
        return [...range(1, siblingCount * 2 + 3), "ellipsis-right", totalPages]
    }

    if (showLeftEllipsis && !showRightEllipsis) {
        return [1, "ellipsis-left", ...range(totalPages - (siblingCount * 2 + 2), totalPages)]
    }

    return [1, "ellipsis-left", ...range(left, right), "ellipsis-right", totalPages]
}
