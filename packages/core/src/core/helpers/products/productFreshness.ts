/**
 * "Yeni Ürün" / "Yeni Varyant" rozetleri için tek kaynak: bir kaydın "yeni"
 * sayılacağı pencere. Şema değişikliği gerekmiyor — `Product.createdAt` ve
 * `ProductVariant.createdAt` zaten var, yalnız eşik burada tanımlı.
 */
export const NEW_ITEM_WINDOW_DAYS = 60

export function getNewItemCutoffDate(referenceDate: Date = new Date()): Date {
    const cutoff = new Date(referenceDate)
    cutoff.setDate(cutoff.getDate() - NEW_ITEM_WINDOW_DAYS)
    return cutoff
}

export function isWithinNewItemWindow(
    createdAt: Date | string,
    referenceDate: Date = new Date(),
): boolean {
    const cutoff = getNewItemCutoffDate(referenceDate)
    return new Date(createdAt).getTime() >= cutoff.getTime()
}
