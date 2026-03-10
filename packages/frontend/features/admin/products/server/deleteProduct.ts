import { adminApiClient } from "@/lib/http/client";

export async function deleteProduct(id: string): Promise<void> {
    await adminApiClient.delete(`/products/${id}`);
}
