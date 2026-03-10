
import { publicApiClient } from "@/lib/http/client";
import type { Product } from "@/features/public/products/types";
import type { ApiEnvelope } from "@/lib/http/types";

export type ProductsListPayload = {
    data: Product[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type ListProductsResponse = ApiEnvelope<ProductsListPayload>;

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
    const res = await publicApiClient.get<ListProductsResponse>(`products?categoryId=${categoryId}`);

    return res.data.payload.data ?? [];
}
