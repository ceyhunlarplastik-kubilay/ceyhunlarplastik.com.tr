/** `GET /products/{id}/variant-matrix` yanıtının istemci tarafı sözleşmesi. */

export type DecimalLike = number | string | { s: number; e: number; d: number[] } | null

export type MatrixRequirement = {
    id: string
    measurementTypeId: string
    /** MeasurementCode — "R", "H1", "D" */
    measurementCode: string
    /** Ürün modeline özel etiket — "Kol Çapı" */
    label: string
    unit: string | null
    isRequired: boolean
    sortPriority: number
    displayOrder: number
}

export type MatrixSize = {
    id: string
    /** Kodun 3. segmenti */
    code: number
    values: Array<{ requirementId: string; value: number }>
}

export type MatrixVersion = {
    id: string
    /** "V1" */
    code: string
    colorId: string | null
    materialIds: string[]
}

/**
 * GLOBAL versiyon sözlüğü kaydı. Renk + hammadde kombinasyonunun numarası TÜM
 * ürünlerde aynıdır ve append-only'dur — yeni kombinasyon eklemek mevcut kodları
 * kaydırmaz.
 */
export type VariantVersionDictionaryEntry = {
    id: string
    code: number
    colorId: string | null
    materialIds: string[]
}

export type MatrixSupplierCode = {
    id: string
    supplierId: string
    supplierName: string
    /** "A" */
    code: string
}

/**
 * Marj alanları (operationalCostRate/netCost/profitRate/listPrice) yalnız
 * owner/admin/purchasing yanıtında bulunur; veri girişi operatöründe HİÇ dönmez.
 */
export type MatrixRowSupplier = {
    id: string
    supplierId: string
    supplierCode: string | null
    fullCode: string | null
    isActive: boolean
    price?: DecimalLike
    operationalCostRate?: DecimalLike
    netCost?: DecimalLike
    profitRate?: DecimalLike
    listPrice?: DecimalLike
    currency?: string | null
    paymentTermDays?: number | null
    supplierVariantCode?: string | null
    supplierNote?: string | null
    minOrderQty?: number | null
    stockQty?: number | null
    hasSupplierLogo?: boolean
    unitsPerPackage?: number | null
    packageLengthMm?: DecimalLike
    packageWidthMm?: DecimalLike
    packageHeightMm?: DecimalLike
    packageWeightKg?: DecimalLike
    minLeadTimeDays?: number | null
}

export type MatrixRow = {
    variantId: string
    /** "10.5.8.V1" — tedarikçi harfi içermez */
    fullCode: string
    name: string
    sizeId: string
    versionId: string
    suppliers: MatrixRowSupplier[]
}

export type VariantMatrix = {
    product: {
        id: string
        code: string
        name: string
        /** null = taslak: kodlar her kayıtta yeniden sıralanır */
        variantCodesLockedAt: string | null
    }
    requirements: MatrixRequirement[]
    sizes: MatrixSize[]
    versions: MatrixVersion[]
    supplierCodes: MatrixSupplierCode[]
    /** Sözlüğün tamamı — bu üründe kullanılmayanlar dahil. */
    versionDictionary: VariantVersionDictionaryEntry[]
    /** Sözlüğe eklenecek sıradaki numara. */
    rows: MatrixRow[]
}

export type VariantMatrixResponse = {
    statusCode: number
    payload: { matrix: VariantMatrix }
}

export type SaveVariantMatrixRowInput = {
    name: string
    measurements: Array<{ requirementId: string; value: number }>
    colorId?: string
    materialIds?: string[]
    supplier?: {
        supplierId: string
        isActive?: boolean
        price?: number
        paymentTermDays?: number
        supplierVariantCode?: string
        supplierNote?: string
        minOrderQty?: number
        stockQty?: number
        currency?: string
        hasSupplierLogo?: boolean
        unitsPerPackage?: number
        packageLengthMm?: number
        packageWidthMm?: number
        packageHeightMm?: number
        packageWeightKg?: number
        minLeadTimeDays?: number
    }
}

export type SaveVariantMatrixResult = {
    productId: string
    isLocked: boolean
    affectedVariantIds: string[]
    createdSizes: number
    createdSupplierCodes: number
    createdVariants: number
    createdVariantSuppliers: number
    rewrittenCodes: number
}

export type SaveVariantMatrixResponse = {
    statusCode: number
    payload: { result: SaveVariantMatrixResult; matrix: VariantMatrix | null }
}

export type VariantCodeLockResponse = {
    statusCode: number
    payload: {
        product: {
            id: string
            variantCodesLockedAt: string | null
            variantCodesLockedByUserId: string | null
        }
    }
}

export type RenumberVariantCodesResponse = {
    statusCode: number
    payload: {
        result: {
            productId: string
            isLocked: boolean
            resortedSizes: number
            rewrittenCodes: number
        }
    }
}
