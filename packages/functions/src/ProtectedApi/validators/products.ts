import { z } from "zod"

/**
 * P2.8(a): Customer varyant tablosunun kendi response validator'ı.
 *
 * Public'teki `productVariantTableResponseValidator` yeniden kullanılmadı çünkü
 * onun `payload` objesi KATI (`.loose()` yalnız en dış objede) → `z.toJSONSchema`
 * `additionalProperties: false` üretiyor ve yeni `customerDiscountPercent` alanı
 * reddedilip 500'e dönüşürdü. Public sözleşmeyi gevşetmek yerine bu endpoint'e
 * kendi şeması verildi; iç objeler `.loose()` (repo konvansiyonu).
 */
export const customerProductVariantTableResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(z.any()),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                    columns: z.array(z.string()),
                }).loose(),
                // Müşterinin genel indirim yüzdesi (0-100) — normalize edilmiş.
                // Customer olmayan çağrıcıda (admin/sales/sales_director) null.
                customerDiscountPercent: z.number().nullable(),
            }).loose(),
        }).loose(),
    }).loose()
)
