import { protectedApiClient } from "@/lib/http/client"
import type {
    ColorReference,
    MaterialReference,
    MeasurementTypeReference,
} from "@/features/admin/productVariants/api/types"

export type SupplierVariantRequestReferences = {
    colors: ColorReference[]
    materials: MaterialReference[]
    measurementTypes: MeasurementTypeReference[]
}

type Response = {
    statusCode: number
    payload: SupplierVariantRequestReferences
}

export async function getSupplierVariantRequestReferences(): Promise<SupplierVariantRequestReferences> {
    const res = await protectedApiClient.get<Response>("/supplier/request-references/variant")
    return res.data.payload
}
