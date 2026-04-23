export type SupplierVariantPrice = {
    id: string
    variantId: string
    supplierId: string
    isActive: boolean
    price: number | string | { s?: number; e?: number; d?: number[] } | null
    currency: string
    createdAt: string
    updatedAt: string
    variant?: {
        id: string
        name: string
        fullCode: string
        productId: string
        product?: {
            id: string
            code: string
            name: string
            categoryId: string
            category?: {
                id: string
                name: string
            }
        }
    }
    supplier?: {
        id: string
        name: string
    }
}

export type ListSupplierVariantPricesResponse = {
    statusCode: number
    payload: {
        data: SupplierVariantPrice[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export type GetSupplierVariantPricesParams = {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    variantId?: string
    productId?: string
    categoryId?: string
}

export type SupplierVariantPriceResponse = {
    statusCode: number
    payload: {
        productVariantSupplier: SupplierVariantPrice
    }
}
