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
}

export async function createMaterialReference({
    name,
    code,
}: Params): Promise<MaterialReference> {
    const res = await adminApiClient.post<CreateMaterialResponse>("/materials", {
        name,
        code,
    })

    return res.data.payload.material
}
