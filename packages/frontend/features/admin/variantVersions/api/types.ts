export type VariantVersionEntry = {
    id: string
    /** 1 → "V1". ÜRÜN MODELİ İÇİNDE tekil; append-only. */
    code: number
    colorId: string | null
    color: { id: string; name: string; code: string; system: string; hex: string } | null
    materials: Array<{ id: string; name: string; code: string | null }>
    /** Kaç varyant bu kombinasyonu kullanıyor — silinebilirliği belirler. */
    variantCount: number
    createdAt: string
}

export type ListVariantVersionsResponse = {
    statusCode: number
    payload: { versions: VariantVersionEntry[]; nextCode: number }
}

export type CreateVariantVersionInput = {
    colorId?: string
    materialIds?: string[]
    code?: number
}
