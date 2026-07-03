import { publicServerClient } from "@/lib/http/serverClient";
import type { GetCategoryResponse } from "@/features/public/categories/api/types";
import type { Category } from "@/features/public/categories/types";
import { cache } from "react";
import { unstable_cache } from "next/cache";

async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
    try {
        const res = await publicServerClient().get<GetCategoryResponse>(`/categories/slug/${slug}`);

        return res.data.payload.category ?? null;
    } catch (error: any) {
        if (error?.response?.status === 404) return null;
        console.error("getCategoryBySlug error:", {
            slug,
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        throw error;
    }
}

const getCachedCategoryBySlug = unstable_cache(fetchCategoryBySlug, ["public-category-by-slug"], {
    revalidate: 60,
});

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
    try {
        return await getCachedCategoryBySlug(slug);
    } catch {
        return null;
    }
});
