import { protectedApiClient } from "@/lib/http/client"
import type {
    ColorReference,
    MaterialReference,
    MeasurementTypeReference,
} from "@/features/admin/productVariants/api/types"

/** Ürün modelinin ölçü şablonundaki tek bir gereksinim. */
export type SupplierVariantRequirement = {
    id: string
    /** Bu modeldeki ad — "Burç Metriği". */
    label: string
    /** MeasurementCode — "R", "M". Metrik diş ayrıştırması buna bakar. */
    measurementCode: string
    unit: string | null
    isRequired: boolean
}

export type SupplierVariantRequestReferences = {
    colors: ColorReference[]
    materials: MaterialReference[]
    measurementTypes: MeasurementTypeReference[]
    /** `productId` verilmezse boş döner. */
    requirements: SupplierVariantRequirement[]
}

type Response = {
    statusCode: number
    payload: SupplierVariantRequestReferences
}

export async function getSupplierVariantRequestReferences(
    productId?: string,
): Promise<SupplierVariantRequestReferences> {
    const res = await protectedApiClient.get<Response>("/supplier/request-references/variant", {
        params: productId ? { productId } : undefined,
    })

    return {
        colors: res.data.payload.colors ?? [],
        materials: res.data.payload.materials ?? [],
        measurementTypes: res.data.payload.measurementTypes ?? [],
        requirements: res.data.payload.requirements ?? [],
    }
}
