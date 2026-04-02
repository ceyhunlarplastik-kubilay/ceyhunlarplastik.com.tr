import { publicServerClient } from "@/lib/http/serverClient";
import type { GetCategoryResponse } from "@/features/public/categories/api/types";
import type { Category } from "@/features/public/categories/types";

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
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
        return null;
    }
}
