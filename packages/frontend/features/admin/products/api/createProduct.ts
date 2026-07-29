import { adminApiClient } from "@/lib/http/client"

import type { Product } from "@/features/public/products/types"
import type { AssetRole, AssetType } from "@/features/public/assets/types"
import type {
    ProductIndustrialUsageFormValues,
    ProductTranslationFormValues,
} from "@/features/admin/products/schema/productFormSchema"

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
    translations?: ProductTranslationFormValues[]
    assemblyVideoUrl?: string | null
    promoVideoUrl?: string | null
}

// Boş input = "alanı temizle" → backend null görmeli, "" değil.
function serializeVideoUrl(value?: string | null) {
    return value?.trim() ? value.trim() : null
}

function serializeIndustrialUsages(industrialUsages?: ProductIndustrialUsageFormValues[]) {
    return industrialUsages?.map(({ imageUrl, ...row }) => row)
}

function serializeTranslations(translations?: ProductTranslationFormValues[]) {
    return translations?.filter((translation) =>
        translation.locale === "tr" || Boolean(translation.name?.trim())
    )
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
    industrialUsages,
    translations,
    assemblyVideoUrl,
    promoVideoUrl,
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
            industrialUsages: serializeIndustrialUsages(industrialUsages),
            translations: serializeTranslations(translations),
            assemblyVideoUrl: serializeVideoUrl(assemblyVideoUrl),
            promoVideoUrl: serializeVideoUrl(promoVideoUrl),
        }
    )
    return res.data.payload.product
}
