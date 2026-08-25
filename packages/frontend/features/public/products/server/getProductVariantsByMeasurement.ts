import { publicServerClient } from "@/lib/http/serverClient";
import type { VariantTableData } from "@/features/public/products/components/ProductVariantTable"
import type { ApiEnvelope } from "@/lib/http/types";
import { cache } from "react";
import { unstable_cache } from "next/cache";

/**
 * Tek ÖLÇÜNÜN varyantları — varyant detay sayfasının (`?m=`) veri kaynağı.
 *
 * Eskiden bu sayfa tablo ucundan 500 varyant çekip İSTEMCİDE tek ölçüye
 * filtreliyordu; ihtiyacının onlarca katını taşıyordu (P1.8 F1.1).
 */

type Payload = { data: VariantTableData[]; columns: string[] };
type Response = ApiEnvelope<Payload>;

async function fetchVariantsByMeasurement(
    productId: string,
    measurementKey: string,
    locale: string,
): Promise<Payload> {
    const res = await publicServerClient().get<Response>(
        `/products/${productId}/variant-measurements`,
        { params: { m: measurementKey, locale } }
    );
    return { data: res.data.payload.data ?? [], columns: res.data.payload.columns ?? [] };
}

const getCached = unstable_cache(fetchVariantsByMeasurement, ["public-product-variants-by-measurement"], {
    revalidate: 60,
});

export type VariantsByMeasurementResult = {
    variants: VariantTableData[];
    /** true = fetch BAŞARISIZ; boş liste "varyant yok" ile karışmasın (P1.8f). */
    error: boolean;
};

export const getProductVariantsByMeasurement = cache(async (
    productId: string,
    measurementKey: string,
    options: { locale?: string } = {},
): Promise<VariantsByMeasurementResult> => {
    if (!measurementKey) return { variants: [], error: false };

    try {
        const payload = await getCached(productId, measurementKey, options.locale ?? "tr");
        return { variants: payload.data, error: false };
    } catch (error: any) {
        console.error("getProductVariantsByMeasurement error:", {
            productId,
            status: error?.response?.status,
            code: error?.code,
            message: error?.message,
        });
        return { variants: [], error: true };
    }
});
