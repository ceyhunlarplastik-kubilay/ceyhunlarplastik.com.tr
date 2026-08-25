import { cache } from "react";
import { protectedServerClient } from "@/lib/http/serverClient";
import type { VariantTableData } from "@/features/public/products/components/ProductVariantTable";
import type { ApiEnvelope } from "@/lib/http/types";

/**
 * Tek ÖLÇÜNÜN varyantları (portal) — public muadilinin authenticated karşılığı.
 *
 * Liste fiyatlı DTO'yu alır. Panel dinamik + auth olduğu için cross-request
 * `unstable_cache` KULLANILMAZ; yalnız React `cache()` ile istek-içi tekilleştirme
 * (public fn'deki gerekçenin aynısı).
 */

type Payload = {
    data: VariantTableData[];
    columns: string[];
    customerDiscountPercent: number | null;
};
type Response = ApiEnvelope<Payload>;

export type CustomerVariantsByMeasurementResult = {
    variants: VariantTableData[];
    customerDiscountPercent: number | null;
    error: boolean;
};

export const getCustomerProductVariantsByMeasurement = cache(async (
    productId: string,
    measurementKey: string,
    options: { locale?: string } = {},
): Promise<CustomerVariantsByMeasurementResult> => {
    if (!measurementKey) return { variants: [], customerDiscountPercent: null, error: false };

    try {
        const client = await protectedServerClient();
        const res = await client.get<Response>(
            `/portal/customer/products/${productId}/variant-measurements`,
            { params: { m: measurementKey, locale: options.locale ?? "tr" } },
        );
        return {
            variants: res.data.payload.data ?? [],
            customerDiscountPercent: res.data.payload.customerDiscountPercent ?? null,
            error: false,
        };
    } catch (error: any) {
        // Next.js kontrol-akışı hatalarını (redirect / notFound / dinamik render
        // bailout) YUTMA — `digest` taşırlar ve Next tarafından yakalanmalıdır.
        if (error && typeof error.digest === "string") throw error;

        console.error(
            `getCustomerProductVariantsByMeasurement error: productId=${productId} ` +
            `status=${error?.response?.status} code=${error?.code} message=${error?.message}`,
        );
        return { variants: [], customerDiscountPercent: null, error: true };
    }
});
