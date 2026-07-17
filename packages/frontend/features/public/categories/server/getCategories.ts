import { publicServerClient } from "@/lib/http/serverClient";
import type { ListCategoriesResponse } from "@/features/public/categories/api/types";
import type { Category } from "@/features/public/categories/types";
import { normalizeCategory } from "@/features/public/categories/normalizeCategory";
import { cache } from "react";
import { unstable_cache } from "next/cache";

async function fetchCategories(locale: string, limit = 500): Promise<Category[]> {
    try {
        const res = await publicServerClient().get<ListCategoriesResponse>("/categories", {
            params: { locale, limit },
        });

        return (res.data.payload.data ?? []).map((category) => normalizeCategory(category, locale));
    } catch (error: any) {
        console.error("getCategories error:", {
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        throw error;
    }
}

const getCachedCategories = unstable_cache(fetchCategories, ["public-categories-v2"], {
    revalidate: 60,
});

export const getCategories = cache(async (
    locale = "tr",
    options: { limit?: number } = {},
): Promise<Category[]> => {
    try {
        return await getCachedCategories(locale, options.limit ?? 500);
    } catch {
        return [];
    }
});
