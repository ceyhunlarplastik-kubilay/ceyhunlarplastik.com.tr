export type Supplier = {
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
    operationalCostRate?: number | string | { s?: number; e?: number; d?: number[] } | null
    netCost?: number | string | { s?: number; e?: number; d?: number[] } | null
    profitRate?: number | string | { s?: number; e?: number; d?: number[] } | null
    listPrice?: number | string | { s?: number; e?: number; d?: number[] } | null
    paymentTermDays?: number | null
    supplierVariantCode?: string | null
    supplierNote?: string | null
    minOrderQty?: number | null
    stockQty?: number | null
    currency?: string | null
    pricingUpdatedAt?: string | null
    availabilityUpdatedAt?: string | null
    createdAt: string
    updatedAt: string
    variant: {
        id: string
        name: string
        fullCode: string
        productId: string
        product: {
            id: string
            code: string
            name: string
            slug: string
            assets?: Array<{
                id: string
                role?: string
                url?: string
            }>
            category: {
                id: string
                code: number
                name: string
                slug: string
            }
        }
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

export type SupplierProductRow = {
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

export type SupplierProductListResponse = {
    statusCode: number
    payload: {
        data: SupplierProductRow[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}
