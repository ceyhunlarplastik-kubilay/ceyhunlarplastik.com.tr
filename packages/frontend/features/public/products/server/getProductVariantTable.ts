import { publicServerClient } from "@/lib/http/serverClient";
import type { VariantTableData } from "@/features/public/products/components/ProductVariantTable"
import type { ApiEnvelope } from "@/lib/http/types";

export type ProductsVariantTableListPayload = {
    data: VariantTableData[];
};

export type ListProductsVariantTableResponse = ApiEnvelope<ProductsVariantTableListPayload>;

export async function getProductVariantTable(productId: string): Promise<VariantTableData[]> {
    const res = await publicServerClient().get<ListProductsVariantTableResponse>(
        `/products/${productId}/variant-table`,
        { params: { limit: 500 } }
    );

    return res.data.payload.data ?? [];
}
