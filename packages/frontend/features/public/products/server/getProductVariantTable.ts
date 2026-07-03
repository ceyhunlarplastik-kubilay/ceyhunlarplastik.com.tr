import { publicServerClient } from "@/lib/http/serverClient";
import type { VariantTableData } from "@/features/public/products/components/ProductVariantTable"
import type { ApiEnvelope } from "@/lib/http/types";
import { cache } from "react";
import { unstable_cache } from "next/cache";

export type ProductsVariantTableListPayload = {
    data: VariantTableData[];
};

export type ListProductsVariantTableResponse = ApiEnvelope<ProductsVariantTableListPayload>;

async function fetchProductVariantTable(productId: string, limit = 500): Promise<VariantTableData[]> {
    const res = await publicServerClient().get<ListProductsVariantTableResponse>(
        `/products/${productId}/variant-table`,
        { params: { limit } }
    );

    return res.data.payload.data ?? [];
}

const getCachedProductVariantTable = unstable_cache(fetchProductVariantTable, ["public-product-variant-table"], {
    revalidate: 60,
});

export const getProductVariantTable = cache(async (
    productId: string,
    options: { limit?: number } = {},
): Promise<VariantTableData[]> => {
    try {
        return await getCachedProductVariantTable(productId, options.limit ?? 500);
    } catch (error: any) {
        console.error("getProductVariantTable error:", {
            productId,
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        return [];
    }
});
