import axios from "axios";
import type { Product } from "@/features/public/products/types";

type GetProductBySlugApiResponse = {
    statusCode: number;
    payload: {
        product: Product;
    };
};

function getPublicApiBaseUrl() {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) {
        throw new Error("NEXT_PUBLIC_API_URL is not defined");
    }
    return url;
}

export async function getProductBySlug(
    slug: string
): Promise<Product | null> {
    const baseURL = getPublicApiBaseUrl();

    try {
        const res = await axios.get<GetProductBySlugApiResponse>(
            `/products/slug/${slug}`,
            {
                baseURL,
                timeout: 20_000,
            }
        );

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