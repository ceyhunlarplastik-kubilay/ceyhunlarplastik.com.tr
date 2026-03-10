import { publicApiClient } from "@/lib/http/client";
import type { GetCategoryResponse } from "@/features/public/categories/api/types";
import type { Category } from "@/features/public/categories/types";

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
    const res = await publicApiClient.get<GetCategoryResponse>(`/categories/slug/${slug}`);

    return res.data.payload.category ?? null;
}
