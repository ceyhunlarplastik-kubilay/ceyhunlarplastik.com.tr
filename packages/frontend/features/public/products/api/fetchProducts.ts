/* import { publicApiClient } from "@/lib/http/client";
import type { Product } from "@/features/public/products/types";
import type { ListProductsResponse } from "@/features/public/products/types";

export async function fetchProducts(): Promise<Product[]> {
    const res = await publicApiClient.get<ListProductsResponse>("/products");
    return res.data.payload.data ?? [];
} */


import { publicApiClient } from "@/lib/http/client";
import type { ListProductsResponse } from "@/features/public/products/types";

export async function fetchProducts(
    params: Record<string, any>
) {
    const res = await publicApiClient.get<ListProductsResponse>("/products", {
        params,
    });

    return res.data.payload;
}