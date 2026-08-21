import { adminApiClient } from "@/lib/http/client"

export type VariantMatrixReferences = {
    colors: Array<{ id: string; code: string; name: string; hex: string; system: string }>
    materials: Array<{ id: string; code: string | null; name: string }>
    /** Yalnız id + ad — vergi numarası/adres/vade taşınmaz. */
    suppliers: Array<{ id: string; name: string }>
    measurementTypes: Array<{ id: string; code: string; name: string; baseUnit: string; displayOrder: number }>
}

type Response = { statusCode: number; payload: VariantMatrixReferences }

export async function getVariantMatrixReferences(): Promise<VariantMatrixReferences> {
    const res = await adminApiClient.get<Response>("/product-variant-matrix/references")

    return {
        colors: res.data.payload.colors ?? [],
        materials: res.data.payload.materials ?? [],
        suppliers: res.data.payload.suppliers ?? [],
        measurementTypes: res.data.payload.measurementTypes ?? [],
    }
}
