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
    industrialUsages?: ProductIndustrialUsage[];
};

export type ProductIndustrialUsage = {
    id?: string;
    productId?: string;
    sectorValueId?: string | null;
    sectorValue?: any | null;
    productionGroupValueId?: string | null;
    productionGroupValue?: any | null;
    usageAreaValueId?: string | null;
    usageAreaValue?: any | null;
    usageFunction?: string | null;
    locale?: string;
    resolvedLocale?: string;
    translationMissing?: boolean;
    translations?: Array<{
        id: string;
        locale: string;
        usageFunction: string;
        createdAt: string;
        updatedAt: string;
    }>;
    imageKey?: string | null;
    imageUrl?: string | null;
    displayOrder?: number;
    createdAt?: string;
    updatedAt?: string;
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
