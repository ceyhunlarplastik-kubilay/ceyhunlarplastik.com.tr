import { cache } from "react";
import { protectedServerClient } from "@/lib/http/serverClient";
import type { VariantTableData } from "@/features/public/products/components/ProductVariantTable";
import type { ProductVariantTableResult } from "@/features/public/products/server/getProductVariantTable";
import type { ApiEnvelope } from "@/lib/http/types";

type CustomerVariantTablePayload = { data: VariantTableData[] };
type CustomerVariantTableResponse = ApiEnvelope<CustomerVariantTablePayload>;

/**
 * Müşteri varyant tablosu (P1.8 B0).
 *
 * Public server fn'in aksine ProtectedApi'yi AUTHENTICATED çağırır ve liste
 * fiyatlı DTO'yu alır. Sayfa panel (dinamik + auth) olduğundan cross-request
 * `unstable_cache` KULLANILMAZ (auth token bağlamı + kullanıcı-bağımsız veri);
 * yalnız React `cache()` ile istek-içi tekilleştirme. Hata/boş ayrımı için
 * public fn ile aynı `{ variants, error }` kontratı (P1.8f).
 */
export const getCustomerProductVariantTable = cache(async (
    productId: string,
    options: { limit?: number } = {},
): Promise<ProductVariantTableResult> => {
    try {
        const client = await protectedServerClient();
        const res = await client.get<CustomerVariantTableResponse>(
            `/portal/customer/products/${productId}/variant-table`,
            { params: { limit: options.limit ?? 500 } },
        );
        return { variants: res.data.payload.data ?? [], error: false };
    } catch (error: any) {
        console.error("getCustomerProductVariantTable error:", {
            productId,
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        return { variants: [], error: true };
    }
});
