export type VariantMeasurement = {
    id: string
    value: number
    label: string
    measurementType: {
        id: string
        code: string
        name: string
        baseUnit?: string
        displayOrder?: number
    }
}

export type VariantSupplier = {
    id: string
    isActive: boolean
    price?: number | string | { s?: number; e?: number; d?: number[] }
    operationalCostRate?: number | string | { s?: number; e?: number; d?: number[] }
    netCost?: number | string | { s?: number; e?: number; d?: number[] }
    profitRate?: number | string | { s?: number; e?: number; d?: number[] }
    listPrice?: number | string | { s?: number; e?: number; d?: number[] }
    paymentTermDays?: number | null
    supplierVariantCode?: string | null
    supplierNote?: string | null
    minOrderQty?: number | null
    stockQty?: number | null
    pricingUpdatedAt?: string | null
    availabilityUpdatedAt?: string | null
    currency?: string
    supplier: {
        id: string
        name: string
    }
}

export type ProductVariant = {
    id: string
    productId: string
    name: string
    fullCode: string
    versionCode: string
    supplierCode: string
    variantIndex: number
    createdAt: string
    color?: {
        id: string
        name: string
        hex?: string
        hexCode?: string
        code: string
        system: string
    } | null
    materials: { id: string; name: string }[]
    measurements: VariantMeasurement[]
    variantSuppliers: VariantSupplier[]
}

export type ColorReference = {
    id: string
    name: string
    hexCode?: string
    code?: string
    system?: string
}

export type MaterialReference = {
    id: string
    name: string
    description?: string
}

export type SupplierReference = {
    id: string
    name: string
    isActive: boolean
}

export type MeasurementTypeReference = {
    id: string
    name: string
    code: string
    baseUnit: string
    displayOrder: number
}

export type VariantReferences = {
    colors: ColorReference[]
    materials: MaterialReference[]
    suppliers: SupplierReference[]
    measurementTypes: MeasurementTypeReference[]
}

export type ListProductVariantsTableResponse = {
    statusCode: number
    payload: {
        data: ProductVariant[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export type GetVariantReferencesResponse = {
    statusCode: number
    payload: VariantReferences
}

export type ProductVariantResponse = {
    statusCode: number
    payload: {
        productVariant: ProductVariant
    }
}

export type UpsertVariantInput = {
    productId: string
    name: string
    versionCode: string
    supplierCode: string
    variantIndex: number
    colorId?: string
    materialIds: string[]
    suppliers: Array<{
        id: string
        isActive?: boolean
        price?: number
        operationalCostRate?: number
        netCost?: number
        profitRate?: number
        listPrice?: number
        paymentTermDays?: number
        supplierVariantCode?: string
        supplierNote?: string
        minOrderQty?: number
        stockQty?: number
        currency?: string
    }>
    measurements: Array<{
        measurementTypeId: string
        value: number
        label: string
    }>
}
