import { adminApiClient } from "@/lib/http/client"
import type { SupplierReference } from "@/features/admin/productVariants/api/types";

type CreateSupplierResponse = {
    statusCode: number
    payload: {
        supplier: SupplierReference
    }
}

type Params = {
    name: string
    isActive?: boolean
}

export async function createSupplierReference({
    name,
    isActive = true,
}: Params): Promise<SupplierReference> {
    const res = await adminApiClient.post<CreateSupplierResponse>("/suppliers", {
        name,
        isActive,
    })

    return res.data.payload.supplier
}
