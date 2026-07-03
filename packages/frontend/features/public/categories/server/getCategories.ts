import { publicServerClient } from "@/lib/http/serverClient";
import type { ListCategoriesResponse } from "@/features/public/categories/api/types";
import type { Category } from "@/features/public/categories/types";
import { cache } from "react";
import { unstable_cache } from "next/cache";

async function fetchCategories(limit = 500): Promise<Category[]> {
    try {
        const res = await publicServerClient().get<ListCategoriesResponse>("/categories", {
            params: { limit },
        });

        return res.data.payload.data ?? [];
    } catch (error: any) {
        console.error("getCategories error:", {
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        throw error;
    }
}

const getCachedCategories = unstable_cache(fetchCategories, ["public-categories"], {
    revalidate: 60,
});

export const getCategories = cache(async (options: { limit?: number } = {}): Promise<Category[]> => {
    try {
        return await getCachedCategories(options.limit ?? 500);
    } catch {
        return [];
    }
});
