import { z } from "zod"

import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { USAGE_FUNCTION_MAX_LENGTH } from "@/core/helpers/products/industrialUsageFunctionPlan"
import { SUPPORTED_LOCALES } from "@/core/i18n/locales"

const localeSchema = z.enum(SUPPORTED_LOCALES)

/**
 * `partialRecord` şart: düz `z.record` her dili `required` yaptığı için ajv
 * strict modu şemayı transpile ETMEZ (strictRequired). Bu haliyle şema
 * bilinmeyen dil kodunu da metin uzunluğu aşımını da reddeder.
 */
const usageFunctionLocaleMapSchema = z.partialRecord(
    localeSchema,
    z.string().max(USAGE_FUNCTION_MAX_LENGTH),
)

const localizedNamesSchema = z.partialRecord(localeSchema, z.string())

// Ürünlerin kullanım satırı sayısı yüksek olabiliyor (kodda 138 satırlık örnek
// var). Frontend yalnız DEĞİŞEN satırları gönderdiği için pratikte çok altında
// kalır; bu tavan kötü niyetli/kazara dev payload'a karşı.
const IMPORT_ROWS_MAX = 500

export const getProductIndustrialUsageFunctionsValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

export const applyProductIndustrialUsageFunctionsValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            rows: z
                .array(
                    z.object({
                        usageId: z.uuid(),
                        usageFunctions: usageFunctionLocaleMapSchema,
                    }),
                )
                .min(1)
                .max(IMPORT_ROWS_MAX),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["rows"],
    },
)

export const getProductIndustrialUsageFunctionsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                product: z.object({
                    id: z.uuid(),
                    code: z.string(),
                    slug: z.string(),
                    name: z.string(),
                    categoryName: z.string().nullable(),
                    names: localizedNamesSchema,
                }),
                taxonomy: z.record(z.string(), localizedNamesSchema),
                rows: z.array(
                    z.object({
                        usageId: z.uuid(),
                        displayOrder: z.number(),
                        sectorValueId: z.string().nullable(),
                        productionGroupValueId: z.string().nullable(),
                        usageAreaValueId: z.string().nullable(),
                        usageFunctions: usageFunctionLocaleMapSchema,
                    }),
                ),
            }),
        }),
    }).loose(),
)

export const applyProductIndustrialUsageFunctionsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                touchedRows: z.number(),
                created: z.number(),
                updated: z.number(),
                unchanged: z.number(),
                byLocale: z.record(
                    z.string(),
                    z.object({
                        created: z.number(),
                        updated: z.number(),
                        unchanged: z.number(),
                    }),
                ),
            }),
        }),
    }).loose(),
)
