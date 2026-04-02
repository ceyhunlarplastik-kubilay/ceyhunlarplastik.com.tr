import { publicServerClient } from "@/lib/http/serverClient";
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

export async function getProductsByCategory(
    category: string,
    by: "id" | "slug" = "id"
): Promise<Product[]> {
    try {
        const res = await publicServerClient().get<ListProductsResponse>("/products", {
            params: by === "id"
                ? { categoryId: category, limit: 500 }
                : { category, limit: 500 },
        });

        return res.data.payload.data ?? [];
    } catch (error: any) {
        if (error?.response?.status === 404) return [];

        console.error("getProductsByCategory error:", {
            category,
            by,
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });

        return [];
    }
}
