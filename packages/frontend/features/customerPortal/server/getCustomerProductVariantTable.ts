import { cache } from "react";
import { protectedServerClient } from "@/lib/http/serverClient";
import type { GroupedMeasurementOption } from "@/features/public/products/utils/groupedMeasurementOption";
import type {
    ProductVariantTableResult,
    VariantTableMeta,
} from "@/features/public/products/server/getProductVariantTable";
import type { ApiEnvelope } from "@/lib/http/types";

type CustomerVariantTablePayload = {
    /** Satır = ÖLÇÜ; gruplama sunucuda yapılır (P1.8(d)). */
    data: GroupedMeasurementOption[];
    meta: VariantTableMeta;
    /** P2.8(a): müşterinin normalize edilmiş genel indirim yüzdesi (0-100). */
    customerDiscountPercent: number | null;
};

const EMPTY_META: VariantTableMeta = { page: 1, limit: 0, total: 0, totalPages: 0, columns: [] };
type CustomerVariantTableResponse = ApiEnvelope<CustomerVariantTablePayload>;

export type CustomerProductVariantTableResult = ProductVariantTableResult & {
    customerDiscountPercent: number | null;
};

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
    options: { page?: number; limit?: number; locale?: string } = {},
): Promise<CustomerProductVariantTableResult> => {
    try {
        const client = await protectedServerClient();
        const res = await client.get<CustomerVariantTableResponse>(
            `/portal/customer/products/${productId}/variant-table`,
            {
                params: {
                    page: options.page ?? 1,
                    limit: options.limit ?? 100,
                    locale: options.locale ?? "tr",
                },
            },
        );
        return {
            options: res.data.payload.data ?? [],
            meta: res.data.payload.meta ?? EMPTY_META,
            customerDiscountPercent: res.data.payload.customerDiscountPercent ?? null,
            error: false,
        };
    } catch (error: any) {
        // Next.js kontrol-akışı hatalarını (redirect / notFound / dinamik render
        // bailout) YUTMA — bunlar `digest` taşır ve Next tarafından yakalanmalıdır.
        // Yutulduklarında sayfa sessizce "veri yok" durumuna düşer ve gerçek sebep
        // kaybolur (bu log'un boş `{}` basmasının olası nedeni buydu).
        if (error && typeof error.digest === "string") throw error;

        // Tek satır string: hem terminalde hem Next error overlay'inde okunur
        // (obje olarak loglandığında overlay `{}` gösterebiliyor).
        console.error(
            `getCustomerProductVariantTable error: productId=${productId} ` +
            `status=${error?.response?.status} code=${error?.code} ` +
            `message=${error?.message ?? String(error)} ` +
            `body=${JSON.stringify(error?.response?.data ?? null)}`,
        );
        return { options: [], meta: EMPTY_META, customerDiscountPercent: null, error: true };
    }
});
