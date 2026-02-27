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
};