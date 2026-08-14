import type { CustomerAssignedProduct } from "@/features/admin/customers/api/types"

/**
 * Kalp butonunun optimistic liste güncellemesi — saf, bu yüzden testlenebilir.
 *
 * Değişmez kural: YALNIZ `source: "CUSTOMER"` satırlarına dokunur. Temsilci
 * ataması (STAFF) aynı varyant için listede duruyorsa olduğu gibi kalır; müşteri
 * kendi favorisini kaldırdığında temsilcinin kaydı ekrandan kaybolmamalıdır.
 */
export function applyFavoriteToggle(
    items: CustomerAssignedProduct[],
    productVariantId: string,
    favorite: boolean,
): CustomerAssignedProduct[] {
    if (!favorite) {
        return items.filter(
            (item) => !(item.productVariantId === productVariantId && item.source === "CUSTOMER"),
        )
    }

    const alreadyFavorite = items.some(
        (item) => item.productVariantId === productVariantId && item.source === "CUSTOMER",
    )
    if (alreadyFavorite) return items

    // Sunucu yanıtı gelene kadar yalnız kalp doluluğu ve rozet için yeterli olan
    // iskelet satır; kartın geri kalanı yanıtla dolar.
    const draft = {
        id: `optimistic-${productVariantId}`,
        productVariantId,
        source: "CUSTOMER",
    } as CustomerAssignedProduct

    return [...items, draft]
}
