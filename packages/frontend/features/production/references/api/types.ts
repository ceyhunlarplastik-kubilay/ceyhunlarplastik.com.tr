export type ReferenceProduct = {
    id: string
    code: string
    name: string
    sizeCount: number
}

export type ReferenceProductSize = {
    id: string
    code: number
    /** "1.3.8" */
    sizeCode: string
    /** "Elcik Çapı: 10 mm" */
    label: string
    variantCount: number
    moldCount: number
}

export type ReferenceProductSizes = {
    product: { id: string; code: string; name: string }
    sizes: ReferenceProductSize[]
}

export type ReferenceMoldSummary = { id: string; code: string; name: string; status: string; cavities: number }

export type ReferenceVariantVersion = {
    /** "V1" */
    code: string
    colorName: string | null
    colorHex: string | null
    /** Kısa hammadde adları ("PP"). */
    materials: string[]
    materialIds: string[]
    signature: string
}

export type ReferenceVariant = { id: string; fullCode: string; version: ReferenceVariantVersion }

/** Yalnız üretilebilir (kullanılabilir kalıbı olan) ölçüler ve varyantları. */
export type ReferenceProductVariants = {
    product: { id: string; code: string; name: string }
    sizes: Array<Pick<ReferenceProductSize, "id" | "code" | "sizeCode" | "label"> & {
        molds: ReferenceMoldSummary[]
        variants: ReferenceVariant[]
    }>
}

export type ReferenceCustomer = { id: string; name: string }
