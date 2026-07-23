export type MeasurementTypeCode =
    | "D"
    | "D1"
    | "D2"
    | "R"
    | "R1"
    | "R2"
    | "L"
    | "L1"
    | "L2"
    | "T"
    | "A"
    | "W"
    | "H"
    | "H1"
    | "H2"
    | "PT"
    | "M"
    | "R_L"

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

export const MEASUREMENT_TYPE_CODES: readonly MeasurementTypeCode[] = [
    "D",
    "D1",
    "D2",
    "R",
    "R1",
    "R2",
    "L",
    "L1",
    "L2",
    "T",
    "A",
    "W",
    "H",
    "H1",
    "H2",
    "PT",
    "M",
    "R_L",
]
