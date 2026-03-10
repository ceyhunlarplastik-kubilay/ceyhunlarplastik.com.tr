// import { adminApiClient } from "@/lib/http/client";
import { adminServerClient } from "@/lib/http/serverClient";
import type { Product } from "@/features/public/products/types";

export type GetProductsParams = {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    categoryId?: string;
};

export type ListProductsResponse = {
    statusCode: number;
    payload: {
        data: Product[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
};

/* export async function getProducts(params?: GetProductsParams): Promise<ListProductsResponse["payload"]> {
    const res = await adminApiClient.get<ListProductsResponse>(`/products`, { params });
    return res.data.payload;
} */

export async function getProducts(params?: GetProductsParams): Promise<ListProductsResponse["payload"]> {
    const client = await adminServerClient();
    const res = await client.get<ListProductsResponse>(`/products`, { params });
    return res.data.payload;
}
