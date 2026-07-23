import { adminApiClient } from "@/lib/http/client"
import type { MaterialReference } from "@/features/admin/productVariants/api/types";

type CreateMaterialResponse = {
    statusCode: number
    payload: {
        material: MaterialReference
    }
}

type Params = {
    name: string
    code?: string
    translations?: Array<{
        locale: "tr" | "en"
        name: string
    }>
}

export async function createMaterialReference({
    name,
    code,
    translations,
}: Params): Promise<MaterialReference> {
    const res = await adminApiClient.post<CreateMaterialResponse>("/materials", {
        name,
        code,
        translations,
    })

    return res.data.payload.material
}
