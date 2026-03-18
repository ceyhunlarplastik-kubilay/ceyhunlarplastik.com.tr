import { adminApiClient } from "@/lib/http/client"
import type { Product } from "@/features/public/products/types"
import type { GetProductResponse } from "./types"

type Params = {
    id: string
}

export async function getProduct({ id }: Params): Promise<Product> {
    const res = await adminApiClient.get<GetProductResponse>(`/products/${id}`)
    return res.data.payload.product
}
