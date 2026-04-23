export type Supplier = {
    id: string
    name: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export type SupplierListResponse = {
    statusCode: number
    payload: {
        data: Supplier[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export type SupplierVariantSupplierRow = {
    id: string
    variantId: string
    supplierId: string
    isActive: boolean
    price?: number | string | { s?: number; e?: number; d?: number[] } | null
    currency?: string | null
    createdAt: string
    updatedAt: string
    variant: {
        id: string
        name: string
        fullCode: string
        productId: string
    }
}

export type SupplierVariantSupplierListResponse = {
    statusCode: number
    payload: {
        data: SupplierVariantSupplierRow[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}
