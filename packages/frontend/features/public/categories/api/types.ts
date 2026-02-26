import type { ApiEnvelope } from "@/lib/http/types";
import type { Category } from "@/features/public/categories/types";

export type CategoriesListPayload = {
    data: Category[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type CategoryGetPayload = {
    category: Category;
};

export type ListCategoriesResponse = ApiEnvelope<CategoriesListPayload>;
export type GetCategoryResponse = ApiEnvelope<CategoryGetPayload>;