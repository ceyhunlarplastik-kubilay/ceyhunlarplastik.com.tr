export type MeasurementRequirement = {
    id: string
    productId: string
    measurementTypeId: string
    /** Ürün modeline özel etiket — "Kol Çapı" */
    label: string
    unit: string | null
    isRequired: boolean
    /** Ölçü KODU sıralamasında anahtar önceliği (küçük olan baskın). */
    sortPriority: number
    displayOrder: number
    measurementType: {
        id: string
        code: string
        name: string
        baseUnit: string
        displayOrder: number
    }
    translations: Array<{ id: string; requirementId: string; locale: string; label: string }>
}

export type MeasurementRequirementsResponse = {
    statusCode: number
    payload: { requirements: MeasurementRequirement[] }
}

export type MeasurementRequirementInput = {
    id?: string
    measurementTypeId: string
    label: string
    unit?: string
    isRequired?: boolean
    sortPriority?: number
    displayOrder?: number
    translations?: Array<{ locale: string; label: string }>
}
