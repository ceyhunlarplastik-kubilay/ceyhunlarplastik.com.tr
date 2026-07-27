import { publicServerClient } from "@/lib/http/serverClient";
import type { ListProductsResponse, ProductListPayload } from "@/features/public/products/types";
import { slimProductCards } from "@/features/public/products/utils/slimProductCards";
import { cache } from "react";
import { unstable_cache } from "next/cache";

// Kategori sayfasının filtresiz ilk görünümü (store default'larıyla birebir): page 1, limit 20.
// ProductFilterList client'ta bunu useProducts initialData olarak kullanır → ilk yükte /products
// client fetch'i (warm ~0.3s, cold ~3.5s) gitmez; ürünler ISR/CDN-cache'li HTML'de gelir.
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

async function fetchCategoryProducts(
    slug: string,
    locale: string,
): Promise<ProductListPayload | null> {
    try {
        const res = await publicServerClient().get<ListProductsResponse>("/products", {
            // view=card: backend kart DTO'su döner (category/translations vb. gelmez).
            params: { category: slug, page: DEFAULT_PAGE, limit: DEFAULT_LIMIT, locale, view: "card" },
        });

        const payload = res.data.payload;
        // Kart listesi için gereksiz alanları at → RSC/HTML payload'ı ~%81 küçülür.
        return {
            ...payload,
            data: slimProductCards(payload.data ?? []),
        };
    } catch (error: any) {
        console.error("getCategoryProducts error:", {
            slug,
            locale,
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        return null;
    }
}

const getCachedCategoryProducts = unstable_cache(
    fetchCategoryProducts,
    ["public-category-products-v1"],
    { revalidate: 60 },
);

export const getCategoryProducts = cache(
    async (slug: string, locale = "tr"): Promise<ProductListPayload | null> => {
        try {
            return await getCachedCategoryProducts(slug, locale);
        } catch {
            return null;
        }
    },
);
