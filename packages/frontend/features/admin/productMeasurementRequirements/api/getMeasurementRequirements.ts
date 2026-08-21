import { adminApiClient } from "@/lib/http/client"
import type {
    MeasurementRequirement,
    MeasurementRequirementsResponse,
} from "@/features/admin/productMeasurementRequirements/api/types"

export async function getMeasurementRequirements(productId: string): Promise<MeasurementRequirement[]> {
    const res = await adminApiClient.get<MeasurementRequirementsResponse>(
        `/products/${productId}/measurement-requirements`
    )

    return res.data.payload.requirements ?? []
}
