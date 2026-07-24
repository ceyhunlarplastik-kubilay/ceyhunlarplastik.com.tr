import { publicServerClient } from "@/lib/http/serverClient";
import type { Product } from "@/features/public/products/types";
import type { ApiEnvelope } from "@/lib/http/types";
import { cache } from "react";
import { unstable_cache } from "next/cache";

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

async function fetchProductsByCategory(
    category: string,
    by: "id" | "slug" = "id",
    locale = "tr",
    limit = 500,
): Promise<Product[]> {
    try {
        const res = await publicServerClient().get<ListProductsResponse>("/products", {
            params: by === "id"
                ? { categoryId: category, locale, limit }
                : { category, locale, limit },
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

        throw error;
    }
}

const getCachedProductsByCategory = unstable_cache(fetchProductsByCategory, ["public-products-by-category-v2"], {
    revalidate: 60,
});

export const getProductsByCategory = cache(async (
    category: string,
    by: "id" | "slug" = "id",
    options: { locale?: string; limit?: number } = {},
): Promise<Product[]> => {
    try {
        return await getCachedProductsByCategory(
            category,
            by,
            options.locale ?? "tr",
            options.limit ?? 500,
        );
    } catch {
        return [];
    }
});
