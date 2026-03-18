import { adminApiClient } from "@/lib/http/client"
import type { MeasurementTypeReference } from "@/features/admin/productVariants/api/types";

type CreateMeasurementTypeResponse = {
    statusCode: number
    payload: {
        measurementType: MeasurementTypeReference
    }
}

type MeasurementTypeCode =
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

type Params = {
    code: MeasurementTypeCode
    name: string
    baseUnit: string
    displayOrder?: number
}

export async function createMeasurementTypeReference({
    code,
    name,
    baseUnit,
    displayOrder = 0,
}: Params): Promise<MeasurementTypeReference> {
    const res = await adminApiClient.post<CreateMeasurementTypeResponse>(
        "/measurement-types",
        {
            code,
            name,
            baseUnit,
            displayOrder,
        }
    )

    return res.data.payload.measurementType
}
