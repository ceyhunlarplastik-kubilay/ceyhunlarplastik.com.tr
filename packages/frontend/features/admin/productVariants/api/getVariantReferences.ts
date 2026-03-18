import { adminApiClient } from "@/lib/http/client"
import type {
    VariantReferences,
    GetVariantReferencesResponse,
} from "@/features/admin/productVariants/api/types"

export async function getVariantReferences(): Promise<VariantReferences> {
    const res = await adminApiClient.get<GetVariantReferencesResponse>(
        "/product-variants/references"
    )

    return {
        colors: res.data.payload.colors ?? [],
        materials: res.data.payload.materials ?? [],
        suppliers: res.data.payload.suppliers ?? [],
        measurementTypes: res.data.payload.measurementTypes ?? [],
    }
}
