import { adminApiClient } from "@/lib/http/client"
import type { AdminWebRequestItem, AdminWebRequestItemResolved } from "@/features/admin/webRequests/api/types"
import type { GetProductResponse } from "@/features/admin/products/api/types"
import type { ProductVariantResponse } from "@/features/admin/productVariants/api/types"

async function resolveItem(item: AdminWebRequestItem): Promise<AdminWebRequestItemResolved> {
    const [productRes, variantRes] = await Promise.all([
        item.productId
            ? adminApiClient.get<GetProductResponse>(`/products/${item.productId}`)
            : Promise.resolve(null),
        item.variantId
            ? adminApiClient.get<ProductVariantResponse>(`/product-variants/${item.variantId}`)
            : Promise.resolve(null),
    ])

    return {
        ...item,
        resolvedProductName: productRes?.data?.payload?.product?.name ?? item.productName,
        resolvedProductCode: productRes?.data?.payload?.product?.code ?? item.productCode,
        resolvedVariantCode: variantRes?.data?.payload?.productVariant?.fullCode ?? item.variantFullCode ?? item.variantKey,
    }
}

export async function getWebRequestItemDetails(items: AdminWebRequestItem[]) {
    return Promise.all(items.map((item) => resolveItem(item)))
}

