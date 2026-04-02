import { publicServerClient } from "@/lib/http/serverClient";
import type { Product } from "@/features/public/products/types";

type GetProductBySlugApiResponse = {
    statusCode: number;
    payload: {
        product: Product;
    };
};

export async function getProductBySlug(
    slug: string
): Promise<Product | null> {
    try {
        const res = await publicServerClient().get<GetProductBySlugApiResponse>(`/products/slug/${slug}`);

        return res.data?.payload?.product ?? null;
    } catch (error: any) {
        if (error?.response?.status === 404) {
            return null;
        }

        console.error("getProductBySlug error:", {
            slug,
            status: error?.response?.status,
            data: error?.response?.data,
            message: error?.message,
        });

        return null;
    }
}
