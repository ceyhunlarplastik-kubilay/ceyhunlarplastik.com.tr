/**
 * Sayfa numarası düğmelerinin dizilimi: 1 … 4 5 [6] 7 8 … 20
 *
 * Saf fonksiyon — çok sayfalı listelerde düğmelerin taşmaması için aktif sayfanın
 * etrafında sabit bir pencere tutar, aradaki boşlukları "ellipsis" ile belirtir.
 * İlk ve son sayfa HER ZAMAN görünür: kullanıcı listenin başına/sonuna tek tıkla
 * gidebilmeli.
 */

export type PaginationSlot = number | "ellipsis"

export function buildPaginationRange(
    page: number,
    totalPages: number,
    siblings = 1,
): PaginationSlot[] {
    if (!Number.isFinite(totalPages) || totalPages < 1) return []

    const current = Math.min(Math.max(1, page), totalPages)

    // İlk + son + aktif + iki komşu grubu + iki ellipsis sığıyorsa hepsini göster.
    const maxSlots = siblings * 2 + 5
    if (totalPages <= maxSlots) {
        return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    const left = Math.max(current - siblings, 1)
    const right = Math.min(current + siblings, totalPages)

    const showLeftEllipsis = left > 2
    const showRightEllipsis = right < totalPages - 1

    const slots: PaginationSlot[] = [1]

    if (showLeftEllipsis) {
        slots.push("ellipsis")
    } else {
        for (let value = 2; value < left; value += 1) slots.push(value)
    }

    for (let value = left; value <= right; value += 1) {
        if (value !== 1 && value !== totalPages) slots.push(value)
    }

    if (showRightEllipsis) {
        slots.push("ellipsis")
    } else {
        for (let value = right + 1; value < totalPages; value += 1) slots.push(value)
    }

    slots.push(totalPages)
    return slots
}
