export type VariantMeasurement = {
    id: string
    value: number
    /** Ürün modeline özel ölçü etiketi ("Kol Çapı") — ölçü TİPİNİN adı değil. */
    label: string
    /** Şablonda ezilmiş birim; yoksa ölçü tipinin taban birimi. */
    unit?: string | null
    measurementType: {
        id: string
        code: string
        name: string
        baseUnit?: string
        displayOrder?: number
    }
}

export type DictionaryTranslation = {
    id: string
    locale: string
    name: string
    createdAt: string
    updatedAt: string
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
    /** Ürün modeli içindeki tedarikçi harfi — kodun 5. segmenti. */
    supplierCode?: string | null
    /** Tedarikçili tam kod: "10.5.8.V1.A". */
    fullCode?: string | null
    hasSupplierLogo?: boolean
    unitsPerPackage?: number | null
    packageLengthMm?: number | string | { s?: number; e?: number; d?: number[] } | null
    packageWidthMm?: number | string | { s?: number; e?: number; d?: number[] } | null
    packageHeightMm?: number | string | { s?: number; e?: number; d?: number[] } | null
    packageWeightKg?: number | string | { s?: number; e?: number; d?: number[] } | null
    minLeadTimeDays?: number | null
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
    /** "10.5.8.V1" — tedarikçi harfi İÇERMEZ, o variantSuppliers[].fullCode'da. */
    fullCode: string
    /** "V1" — renk + hammadde kombinasyonu. */
    versionCode: string | null
    /** Kodun 3. segmenti; eski `variantIndex`'in yerini aldı. */
    sizeCode: number | null
    createdAt: string
    color?: {
        id: string
        name: string
        translations?: DictionaryTranslation[]
        hex?: string
        hexCode?: string
        code: string
        system: string
    } | null
    materials: MaterialReference[]
    measurements: VariantMeasurement[]
    variantSuppliers: VariantSupplier[]
}

export type ColorReference = {
    id: string
    name: string
    translations?: DictionaryTranslation[]
    hexCode?: string
    code?: string
    system?: string
}

export type MaterialReference = {
    id: string
    name: string
    translations?: DictionaryTranslation[]
    code?: string | null
    description?: string
    assets?: Array<{
        id: string
        key: string
        mimeType: string
        type: string
        role: string
        url?: string
        createdAt?: string
        updatedAt?: string
    }>
}

export type SupplierReference = {
    id: string
    name: string
    isActive: boolean
}

export type MeasurementTypeReference = {
    id: string
    name: string
    translations?: DictionaryTranslation[]
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

/**
 * Kod alanları YOK: sunucu kodları ölçü/versiyon/tedarikçiden türetiyor.
 * Ölçüler ürün modelinin ŞABLONUNDAKİ `requirementId` ile gönderilir.
 */
export type UpsertVariantInput = {
    productId: string
    name: string
    colorId?: string
    materialIds: string[]
    measurements: Array<{ requirementId: string; value: number }>
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
}
