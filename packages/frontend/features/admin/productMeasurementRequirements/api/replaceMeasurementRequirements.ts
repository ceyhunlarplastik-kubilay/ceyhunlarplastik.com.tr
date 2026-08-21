import { adminApiClient } from "@/lib/http/client"
import type {
    MeasurementRequirement,
    MeasurementRequirementInput,
    MeasurementRequirementsResponse,
} from "@/features/admin/productMeasurementRequirements/api/types"

/** Şablonu TAM olarak değiştirir — listede olmayan ölçü silinir. */
export async function replaceMeasurementRequirements(input: {
    productId: string
    requirements: MeasurementRequirementInput[]
}): Promise<MeasurementRequirement[]> {
    const res = await adminApiClient.put<MeasurementRequirementsResponse>(
        `/products/${input.productId}/measurement-requirements`,
        { requirements: input.requirements }
    )

    return res.data.payload.requirements ?? []
}
