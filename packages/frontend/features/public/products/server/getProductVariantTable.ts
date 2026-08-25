import { publicServerClient } from "@/lib/http/serverClient";
import type { GroupedMeasurementOption } from "@/features/public/products/utils/groupedMeasurementOption"
import type { ApiEnvelope } from "@/lib/http/types";
import { cache } from "react";
import { unstable_cache } from "next/cache";

/**
 * Varyant tablosu — satır = ÖLÇÜ.
 *
 * Sunucu artık gruplanmış satır döndürüyor ve sayfalama ölçü üzerinde yapılıyor
 * (P1.8(d)). Eskiden burada 500 ham varyant çekilip gruplama RSC sayfa katmanında
 * yapılıyordu; 500'ü aşan ürünlerde fazlası SESSİZCE düşüyordu.
 */

export type VariantTableMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    columns: string[];
};

export type ProductsVariantTablePayload = {
    data: GroupedMeasurementOption[];
    meta: VariantTableMeta;
};

export type ListProductsVariantTableResponse = ApiEnvelope<ProductsVariantTablePayload>;

const EMPTY_META: VariantTableMeta = { page: 1, limit: 0, total: 0, totalPages: 0, columns: [] };

async function fetchProductVariantTable(
    productId: string,
    page: number,
    limit: number,
    locale: string,
): Promise<ProductsVariantTablePayload> {
    const res = await publicServerClient().get<ListProductsVariantTableResponse>(
        `/products/${productId}/variant-table`,
        { params: { page, limit, locale } }
    );

    return {
        data: res.data.payload.data ?? [],
        meta: res.data.payload.meta ?? EMPTY_META,
    };
}

const getCachedProductVariantTable = unstable_cache(fetchProductVariantTable, ["public-product-variant-table"], {
    revalidate: 60,
});

export type ProductVariantTableResult = {
    options: GroupedMeasurementOption[];
    meta: VariantTableMeta;
    /**
     * true = fetch BAŞARISIZ (boş liste gerçek "varyant yok" değil, hata sonucu).
     * Çağıran bu ayrımı yaparak yanıltıcı "ölçü bulunamadı" yerine hata durumu
     * gösterebilir (P1.8f).
     */
    error: boolean;
};

export const getProductVariantTable = cache(async (
    productId: string,
    options: { page?: number; limit?: number; locale?: string } = {},
): Promise<ProductVariantTableResult> => {
    try {
        const payload = await getCachedProductVariantTable(
            productId,
            options.page ?? 1,
            options.limit ?? 100,
            options.locale ?? "tr",
        );
        return { options: payload.data, meta: payload.meta, error: false };
    } catch (error: any) {
        console.error("getProductVariantTable error:", {
            productId,
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        return { options: [], meta: EMPTY_META, error: true };
    }
});
