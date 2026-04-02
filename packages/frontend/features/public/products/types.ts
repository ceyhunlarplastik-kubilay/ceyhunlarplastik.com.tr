import type { ApiEnvelope } from "@/lib/http/types";
import type { Category } from "@/features/public/categories/types";

export type Product = {
    id: string;
    code: string;
    name: string;
    slug: string;
    description?: string | null;
    categoryId: string;
    createdAt: string;
    updatedAt: string;
    category?: Category;
    assets?: any[];
    attributeValues?: any[];
};


export type ProductGetPayload = {
    product: Product;
};

// export type ListCategoriesResponse = ApiEnvelope<CategoriesListPayload>;
export type GetProductResponse = ApiEnvelope<ProductGetPayload>;

export type ListProductsResponse = ApiEnvelope<{
    data: Product[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
