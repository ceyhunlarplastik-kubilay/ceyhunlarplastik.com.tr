import { adminApiClient } from "@/lib/http/client"

import type { Product } from "@/features/public/products/types"
import type { AssetRole, AssetType } from "@/features/public/assets/types"
import type {
    ProductIndustrialUsageFormValues,
    ProductTranslationFormValues,
} from "@/features/admin/products/schema/productFormSchema"
import {
    serializeIndustrialUsages,
    serializeTranslations,
    serializeVideoUrl,
} from "@/features/admin/products/api/serializeProductPayload"

import type { UpdateProductResponse } from "./types"

type Params = {
    id: string

    code?: string
    name?: string
    description?: string
    categoryId?: string

    assetType?: AssetType
    assetRole?: AssetRole
    assetKey?: string
    mimeType?: string
    attributeValueIds?: string[]
    industrialUsages?: ProductIndustrialUsageFormValues[]
    translations?: ProductTranslationFormValues[]
    assemblyVideoUrl?: string | null
    promoVideoUrl?: string | null
}

export async function updateProduct({
    id,
    code,
    name,
    description,
    categoryId,
    assetType,
    assetRole,
    assetKey,
    mimeType,
    attributeValueIds,
    industrialUsages,
    translations,
    assemblyVideoUrl,
    promoVideoUrl,
}: Params): Promise<Product> {
    const res = await adminApiClient.put<UpdateProductResponse>(
        `/products/${id}`,
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
            industrialUsages: serializeIndustrialUsages(industrialUsages),
            translations: serializeTranslations(translations),
            assemblyVideoUrl: serializeVideoUrl(assemblyVideoUrl),
            promoVideoUrl: serializeVideoUrl(promoVideoUrl),
        }
    )
    return res.data.payload.product
}
