import { adminApiClient } from "@/lib/http/client"
import type { MeasurementTypeReference } from "@/features/admin/productVariants/api/types";
import type { SupportedLocale } from "@core/i18n/locales"
import type { MeasurementCodeValue } from "@core/helpers/productVariants/measurementCodes"

type CreateMeasurementTypeResponse = {
    statusCode: number
    payload: {
        measurementType: MeasurementTypeReference
    }
}

type Params = {
    code: MeasurementCodeValue
    name: string
    baseUnit: string
    displayOrder?: number
    translations?: Array<{
        locale: SupportedLocale
        name: string
    }>
}

export async function createMeasurementTypeReference({
    code,
    name,
    baseUnit,
    displayOrder = 0,
    translations,
}: Params): Promise<MeasurementTypeReference> {
    const res = await adminApiClient.post<CreateMeasurementTypeResponse>(
        "/measurement-types",
        {
            code,
            name,
            baseUnit,
            displayOrder,
            translations,
        }
    )

    return res.data.payload.measurementType
}
