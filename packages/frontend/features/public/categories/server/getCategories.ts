import { publicApiClient } from "@/lib/http/client";
import type { ListCategoriesResponse } from "@/features/public/categories/api/types";
import type { Category } from "@/features/public/categories/types";

export async function getCategories(): Promise<Category[]> {
    const res = await publicApiClient.get<ListCategoriesResponse>("/categories");

    return res.data.payload.data ?? [];
}
