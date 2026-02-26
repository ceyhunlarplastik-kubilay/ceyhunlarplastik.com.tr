import { publicApiClient } from "@/lib/http/client";
import type { Category } from "@/features/public/categories/types";
import type { ListCategoriesResponse, GetCategoryResponse } from "./types";

export async function fetchCategories(): Promise<Category[]> {
    const res = await publicApiClient.get<ListCategoriesResponse>("/categories");
    return res.data.payload.data ?? [];
}

export async function fetchCategoryById(id: string): Promise<Category> {
    const res = await publicApiClient.get<GetCategoryResponse>(`/categories/${id}`);
    return res.data.payload.category;
}