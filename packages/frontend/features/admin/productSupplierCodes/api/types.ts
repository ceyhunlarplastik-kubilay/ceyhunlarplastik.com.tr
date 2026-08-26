export type ProductSupplierCodeEntry = {
    id: string
    /** "A" — ÜRÜN MODELİ İÇİNDE tekil; append-only, değiştirilemez. */
    code: string
    supplierId: string
    supplier: { id: string; name: string }
    /** Kaç varyant satırı bu tedarikçiyi kullanıyor — silinebilirliği belirler. */
    usageCount: number
    createdAt: string
}

export type ListProductSupplierCodesResponse = {
    statusCode: number
    payload: { codes: ProductSupplierCodeEntry[] }
}

export type CreateProductSupplierCodeInput = {
    supplierId: string
    code?: string
}
