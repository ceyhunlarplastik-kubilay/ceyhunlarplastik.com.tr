import { publicServerClient } from "@/lib/http/serverClient";
import type { ListAttributesResponse } from "@/features/public/productAttributes/types";
import type { ProductAttribute } from "@/features/public/productAttributes/types"

export async function getAttributesForFilter(): Promise<ProductAttribute[]> {
    try {
        const res = await publicServerClient().get<ListAttributesResponse>("/product-attributes/with-values");

        return res.data.payload.data ?? [];
    } catch (error: any) {
        console.error("getAttributesForFilter error:", {
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        return [];
    }
}
