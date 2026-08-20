/**
 * Tedarikçi satırındaki MARJ alanlarının görünürlük kuralı.
 *
 * Veri girişi operatörü (`content_editor`) katalogdan giriş yapar: tedarikçinin
 * bize verdiği fiyat (`price`), tedarikçi kodu, logo, koli bilgisi, minimum sipariş
 * ve termin. Bunlar katalog verisidir.
 *
 * Marj alanları (`operationalCostRate`, `netCost`, `profitRate`, `listPrice`) ise
 * şirketin MÜŞTERİYE fiyatını belirler ve satın alma/yönetici işidir. AGENTS.md'nin
 * "content_editor ticari alanlardan uzak dursun" ilkesi gereği operatöre ne yazma
 * ne okuma yetkisi verilir; bu alanlar mevcut `/product-variant-suppliers`
 * yüzeyinden yönetilmeye devam eder.
 *
 * DİKKAT: `price` tedarikçinin BİZE fiyatıdır (alış) — operatörün "liste fiyatı"
 * dediği alan budur. `listPrice` bizim müşteriye liste fiyatımızdır ve
 * `netCost × (1 + profitRate)` ile türetilir.
 */

export const VARIANT_SUPPLIER_MARGIN_FIELDS = [
    "operationalCostRate",
    "netCost",
    "profitRate",
    "listPrice",
] as const

export type VariantSupplierMarginField = (typeof VARIANT_SUPPLIER_MARGIN_FIELDS)[number]

type MarginCapableUser = {
    isOwner?: boolean
    isAdmin?: boolean
    isPurchasing?: boolean
    isContentEditor?: boolean
}

/** Marj alanlarını görebilen/yazabilen roller. */
export function canManageVariantSupplierMargins(user: MarginCapableUser | undefined | null): boolean {
    if (!user) return false
    return Boolean(user.isOwner || user.isAdmin || user.isPurchasing)
}

/**
 * Marj alanlarını objeden çıkarır. Yanıt yolunda da istek yolunda da kullanılır:
 * operatörün gönderdiği bir marj alanı sessizce YOK SAYILIR, kaydedilmez.
 */
export function stripVariantSupplierMargins<T extends object>(
    row: T,
): Omit<T, VariantSupplierMarginField> {
    const clone = { ...row } as Record<string, unknown>
    for (const field of VARIANT_SUPPLIER_MARGIN_FIELDS) {
        delete clone[field]
    }
    return clone as Omit<T, VariantSupplierMarginField>
}

/** Kullanıcının yetkisine göre marj alanlarını korur veya çıkarır. */
export function applyVariantSupplierMarginVisibility<T extends object>(
    row: T,
    user: MarginCapableUser | undefined | null,
): T | Omit<T, VariantSupplierMarginField> {
    return canManageVariantSupplierMargins(user) ? row : stripVariantSupplierMargins(row)
}
