import { publicServerClient } from "@/lib/http/serverClient";
import type { GetCategoryResponse } from "@/features/public/categories/api/types";
import type { Category } from "@/features/public/categories/types";
import { normalizeCategory } from "@/features/public/categories/normalizeCategory";
import { cache } from "react";
import { unstable_cache } from "next/cache";

async function fetchCategoryBySlug(slug: string, locale: string): Promise<Category | null> {
    try {
        const res = await publicServerClient().get<GetCategoryResponse>(`/categories/slug/${slug}`, {
            params: { locale },
        });

        const category = res.data.payload.category;
        return category ? normalizeCategory(category, locale) : null;
    } catch (error: any) {
        if (error?.response?.status === 404) return null;
        console.error("getCategoryBySlug error:", {
            slug,
            locale,
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        throw error;
    }
}

const getCachedCategoryBySlug = unstable_cache(fetchCategoryBySlug, ["public-category-by-slug-v2"], {
    revalidate: 60,
});

export const getCategoryBySlug = cache(async (slug: string, locale = "tr"): Promise<Category | null> => {
    try {
        return await getCachedCategoryBySlug(slug, locale);
    } catch {
        return null;
    }
});
