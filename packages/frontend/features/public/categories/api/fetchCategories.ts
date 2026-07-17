import { publicApiClient } from "@/lib/http/client";
import type { Category } from "@/features/public/categories/types";
import { normalizeCategory } from "@/features/public/categories/normalizeCategory";
import type { ListCategoriesResponse, GetCategoryResponse } from "./types";

export async function fetchCategories(locale: string): Promise<Category[]> {
    const res = await publicApiClient.get<ListCategoriesResponse>("/categories", {
        params: { locale, limit: 500 },
    });
    return (res.data.payload.data ?? []).map((category) => normalizeCategory(category, locale));
}

export async function fetchCategoryById(id: string, locale: string): Promise<Category> {
    const res = await publicApiClient.get<GetCategoryResponse>(`/categories/${id}`, {
        params: { locale },
    });
    return normalizeCategory(res.data.payload.category, locale);
}

export async function fetchCategoryBySlug(slug: string, locale: string): Promise<Category> {
    const res = await publicApiClient.get<GetCategoryResponse>(`/categories/slug/${slug}`, {
        params: { locale },
    });
    return normalizeCategory(res.data.payload.category, locale);
}
