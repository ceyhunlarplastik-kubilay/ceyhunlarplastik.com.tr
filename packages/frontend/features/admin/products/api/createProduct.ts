import { adminApiClient } from "@/lib/http/client"

import type { Product } from "@/features/public/products/types"
import type { AssetRole, AssetType } from "@/features/public/assets/types"

import type { CreateProductResponse } from "./types"

type Params = {
    code: string
    name: string
    categoryId: string
    assetType?: AssetType
    assetRole?: AssetRole
    assetKey?: string
    mimeType?: string
    attributeValueIds?: string[]
}

export async function createProduct({
    code,
    name,
    categoryId,
    assetType,
    assetRole,
    assetKey,
    mimeType,
    attributeValueIds
}: Params): Promise<Product> {
    const res = await adminApiClient.post<CreateProductResponse>(
        "/products",
        {
            code,
            name,
            categoryId,
            assetType,
            assetRole,
            assetKey,
            mimeType,
            attributeValueIds
        }
    )
    return res.data.payload.product
}
