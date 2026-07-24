import { publicServerClient } from "@/lib/http/serverClient";
import type { Product } from "@/features/public/products/types";
import { cache } from "react";
import { unstable_cache } from "next/cache";

type GetProductBySlugApiResponse = {
    statusCode: number;
    payload: {
        product: Product;
    };
};

async function fetchProductBySlug(slug: string, locale: string): Promise<Product | null> {
    try {
        const res = await publicServerClient().get<GetProductBySlugApiResponse>(`/products/slug/${slug}`, {
            params: { locale },
        });

        return res.data?.payload?.product ?? null;
    } catch (error: any) {
        if (error?.response?.status === 404) {
            return null;
        }

        console.error("getProductBySlug error:", {
            slug,
            locale,
            status: error?.response?.status,
            data: error?.response?.data,
            message: error?.message,
        });

        throw error;
    }
}

const getCachedProductBySlug = unstable_cache(fetchProductBySlug, ["public-product-by-slug-v3"], {
    revalidate: 60,
});

export const getProductBySlug = cache(async (
    slug: string,
    locale = "tr",
): Promise<Product | null> => {
    try {
        return await getCachedProductBySlug(slug, locale);
    } catch {
        return null;
    }
});
