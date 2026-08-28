import { z } from "zod"
import { CART_LOGISTICS_PROFILE_STATUSES } from "@/core/helpers/logistics/cartLogistics"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const portalCartLogisticsBodySchema = z.object({
    variantIds: z.array(z.uuid()).min(1).max(500),
})

export const portalCartLogisticsRequestValidator = validatorWrapper(
    z.object({ body: portalCartLogisticsBodySchema }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["variantIds"],
    },
)

const readyCartLogisticsProfileSchema = z.object({
    productVariantId: z.uuid(),
    status: z.literal("READY"),
    logistics: z.object({
        unitsPerPackage: z.number().int().positive(),
        packageVolumeM3: z.number().positive(),
        packageWeightKg: z.number().positive().nullable(),
    }),
})

const unavailableCartLogisticsProfileSchema = z.object({
    productVariantId: z.uuid(),
    status: z.enum(CART_LOGISTICS_PROFILE_STATUSES.filter((status) => status !== "READY")),
    logistics: z.null(),
})

export const portalCartLogisticsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                profiles: z.array(z.union([
                    readyCartLogisticsProfileSchema,
                    unavailableCartLogisticsProfileSchema,
                ])),
            }),
        }).loose(),
    }).loose(),
)

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

/**
 * Tek ölçünün varyantları (portal). Public muadiliyle aynı yapı + fiyat overlay'i
 * için `customerDiscountPercent`.
 */
export const customerProductVariantsByMeasurementResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(z.any()),
                columns: z.array(z.string()),
                customerDiscountPercent: z.number().nullable(),
            }).loose(),
        }).loose(),
    }).loose()
)
