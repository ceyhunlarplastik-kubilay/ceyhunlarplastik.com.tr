export type SupplierVariantPrice = {
    id: string
    variantId: string
    supplierId: string
    isActive: boolean
    price: number | string | { s?: number; e?: number; d?: number[] } | null
    operationalCostRate?: number | string | { s?: number; e?: number; d?: number[] } | null
    netCost?: number | string | { s?: number; e?: number; d?: number[] } | null
    profitRate?: number | string | { s?: number; e?: number; d?: number[] } | null
    listPrice?: number | string | { s?: number; e?: number; d?: number[] } | null
    paymentTermDays?: number | null
    supplierVariantCode?: string | null
    supplierNote?: string | null
    minOrderQty?: number | null
    stockQty?: number | null
    pricingUpdatedAt?: string | null
    availabilityUpdatedAt?: string | null
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
    supplierId?: string
    endpointPrefix?: "supplier" | "purchasing" | "sales"
}

export type SupplierVariantPriceResponse = {
    statusCode: number
    payload: {
        productVariantSupplier: SupplierVariantPrice
    }
}

export type SupplierProduct = {
    id: string
    code: string
    name: string
    slug: string
    categoryId: string
    createdAt: string
    updatedAt: string
    variantCount: number
    category: {
        id: string
        code: number
        name: string
        slug: string
    }
    assets?: Array<{
        id: string
        role?: string
        url?: string
    }>
}

export type ListSupplierProductsResponse = {
    statusCode: number
    payload: {
        data: SupplierProduct[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export type SupplierProfile = {
    id: string
    name: string
    contactName?: string | null
    phone?: string | null
    address?: string | null
    taxNumber?: string | null
    defaultPaymentTermDays?: number | null
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export type SupplierProfileResponse = {
    statusCode: number
    payload: {
        supplier: SupplierProfile | null
    }
}
