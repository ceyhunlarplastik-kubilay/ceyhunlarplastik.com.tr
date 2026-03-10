import { adminApiClient } from "@/lib/http/client";
import type { GetProductResponse, Product } from "@/features/public/products/types";
import type { CreateProductInput } from "./createProduct";

export type UpdateProductInput = Partial<CreateProductInput>;

export async function updateProduct(id: string, product: UpdateProductInput): Promise<Product | null> {
    const res = await adminApiClient.put<GetProductResponse>(`/products/${id}`, product);
    return res.data.payload.product ?? null;
}
