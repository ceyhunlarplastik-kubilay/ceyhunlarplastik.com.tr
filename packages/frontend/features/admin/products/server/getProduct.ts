import { adminApiClient } from "@/lib/http/client";
import type { GetProductResponse, Product } from "@/features/public/products/types";

export async function getProduct(id: string): Promise<Product | null> {
    const res = await adminApiClient.get<GetProductResponse>(`/products/${id}`);
    return res.data.payload.product ?? null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
    const res = await adminApiClient.get<GetProductResponse>(`/products/slug/${slug}`);
    return res.data.payload.product ?? null;
}
