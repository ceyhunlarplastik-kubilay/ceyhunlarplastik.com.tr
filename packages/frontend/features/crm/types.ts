/**
 * Müşteri profiliyle eşleşen ürün — potansiyel (LEAD) ve cari (CUSTOMER)
 * müşteri ayırt etmez. Backend'de `getCustomerProfileMatchedProducts`
 * (core CRM helper) üretir; veri girişi paneli ve satış paneli aynı şekli
 * kullanır.
 */
export type CustomerProfileMatchedProduct = {
    id: string
    code: string
    name: string
    slug: string
    categoryName: string | null
    primaryImageUrl: string | null
    matchedLabels: string[]
}

export type CustomerProfileMatchedProductsResult = {
    hasProfile: boolean
    matchedProductCount: number
    matchedProducts: CustomerProfileMatchedProduct[]
}
