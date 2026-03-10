import { adminApiClient } from "@/lib/http/client";
import type { GetProductResponse, Product } from "@/features/public/products/types";

export type CreateProductInput = {
    code: string;
    name: string;
    categoryId: string;
};

export async function createProduct(product: CreateProductInput): Promise<Product | null> {
    const res = await adminApiClient.post<GetProductResponse>(`/products`, product);
    return res.data.payload.product ?? null;
}
