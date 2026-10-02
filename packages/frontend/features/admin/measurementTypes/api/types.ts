import { MEASUREMENT_CODES, type MeasurementCodeValue } from "@core/helpers/productVariants/measurementCodes"

/** Kod listesinin tek kaynağı core'da (Prisma enum'u ile testle bağlı) — burada kopyalanmaz. */
export type MeasurementTypeCode = MeasurementCodeValue

export type MeasurementTypeTranslation = {
    id: string
    locale: string
    name: string
    createdAt: string
    updatedAt: string
}

export type MeasurementType = {
    id: string
    code: MeasurementTypeCode
    name: string
    translations?: MeasurementTypeTranslation[]
    baseUnit: string
    displayOrder: number
    createdAt: string
    updatedAt: string
}

export type ListMeasurementTypesResponse = {
    statusCode: number
    payload: {
        data: MeasurementType[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export type MeasurementTypeResponse = {
    statusCode: number
    payload: {
        measurementType: MeasurementType
    }
}

export const MEASUREMENT_TYPE_CODES = MEASUREMENT_CODES
