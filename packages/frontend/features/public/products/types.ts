import type { ApiEnvelope } from "@/lib/http/types";
import type { Category } from "@/features/public/categories/types";

export type Product = {
    id: string;
    code: string;
    name: string;
    slug: string;
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
