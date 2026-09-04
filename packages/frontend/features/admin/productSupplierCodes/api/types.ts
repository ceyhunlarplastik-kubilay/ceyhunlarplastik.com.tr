/**
 * Ürün modeli + tedarikçi harfi başına TEK teknik resim. `PENDING_UPLOAD` iken
 * arayüz "İşleniyor" rozeti gösterir; S3 ObjectCreated onayı `ACTIVE` yapar.
 */
export type SupplierCodeDrawing = {
    id: string
    key: string
    url: string
    mimeType: string
    uploadStatus: "PENDING_UPLOAD" | "ACTIVE"
    uploadedAt: string | null
    createdAt: string
}

export type ProductSupplierCodeEntry = {
    id: string
    /** "A" — ÜRÜN MODELİ İÇİNDE tekil; append-only, değiştirilemez. */
    code: string
    supplierId: string
    supplier: { id: string; name: string }
    /** Kaç varyant satırı bu tedarikçiyi kullanıyor — silinebilirliği belirler. */
    usageCount: number
    /** En güncel teknik resim (varsa); yoksa null. */
    technicalDrawing: SupplierCodeDrawing | null
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
