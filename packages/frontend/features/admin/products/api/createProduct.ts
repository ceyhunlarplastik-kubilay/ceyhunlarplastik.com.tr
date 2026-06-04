import { adminApiClient } from "@/lib/http/client"

import type { Product } from "@/features/public/products/types"
import type { AssetRole, AssetType } from "@/features/public/assets/types"
import type { ProductIndustrialUsageFormValues } from "@/features/admin/products/schema/productFormSchema"

import type { CreateProductResponse } from "./types"

type Params = {
    code: string
    name: string
    description?: string
    categoryId: string
    assetType?: AssetType
    assetRole?: AssetRole
    assetKey?: string
    mimeType?: string
    attributeValueIds?: string[]
    industrialUsages?: ProductIndustrialUsageFormValues[]
}

export async function createProduct({
    code,
    name,
    description,
    categoryId,
    assetType,
    assetRole,
    assetKey,
    mimeType,
    attributeValueIds,
    industrialUsages
}: Params): Promise<Product> {
    const res = await adminApiClient.post<CreateProductResponse>(
        "/products",
        {
            code,
            name,
            description,
            categoryId,
            assetType,
            assetRole,
            assetKey,
            mimeType,
            attributeValueIds,
            industrialUsages
        }
    )
    return res.data.payload.product
}
