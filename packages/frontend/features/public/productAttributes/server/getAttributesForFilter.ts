import { publicApiClient } from "@/lib/http/client";
import type { ListAttributesResponse } from "@/features/public/productAttributes/types";
import type { ProductAttribute } from "@/features/public/productAttributes/types"

export async function getAttributesForFilter(): Promise<ProductAttribute[]> {
    const res = await publicApiClient.get<ListAttributesResponse>("/product-attributes/with-values");

    return res.data.payload.data ?? [];
}
