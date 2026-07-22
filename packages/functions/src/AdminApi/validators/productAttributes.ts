import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const productAttributeCodeSchema = z.string().min(2).max(100).regex(
    /^[a-z][a-z0-9_]*$/,
    "Code must be lower snake_case"
)
const localeSchema = z.enum(["tr", "en"])
const removableTranslationLocaleSchema = z.literal("en")
const productAttributeTranslationInputSchema = z.object({
    locale: localeSchema,
    name: z.string().min(2).max(100),
})
const productAttributeTranslationSchema = z.object({
    id: z.uuid(),
    locale: z.string(),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})
const productAttributeValueTranslationSchema = z.object({
    id: z.uuid(),
    locale: z.string(),
    name: z.string(),
    slug: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const createProductAttributeValidator = validatorWrapper(
    z.object({
        body: z.object({
            code: productAttributeCodeSchema,
            name: z.string().min(2).max(100),
            translations: z.array(productAttributeTranslationInputSchema).max(10).optional(),
            displayOrder: z.number().optional(),
            isCustomerAssignable: z.boolean().optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["code", "name"],
    }
)

export const getProductAttributeValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const deleteProductAttributeValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const updateProductAttributeValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            code: productAttributeCodeSchema.optional(),
            name: z.string().min(2).max(100).optional(),
            translations: z.array(productAttributeTranslationInputSchema).max(10).optional(),
            removeTranslationLocales: z.array(removableTranslationLocaleSchema).max(1).optional(),
            displayOrder: z.number().optional(),
            isCustomerAssignable: z.boolean().optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    }
)

// Response Validators
export const productAttributeSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    locale: localeSchema.optional(),
    resolvedLocale: z.string().optional(),
    translationMissing: z.boolean().optional(),
    translations: z.array(productAttributeTranslationSchema).optional(),
    displayOrder: z.number(),
    isActive: z.boolean(),
    isCustomerAssignable: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const productAttributeResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                productAttribute: productAttributeSchema,
            })
        })
    }).loose()
)

export const listProductAttributesResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(productAttributeSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                })
            })
        })
    }).loose()
)





const productAttributeFilterSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    isCustomerAssignable: z.boolean(),
    values: z.array(
        z.object({
            id: z.uuid(),
            name: z.string(),
            slug: z.string(),
            locale: localeSchema.optional(),
            resolvedLocale: z.string().optional(),
            translationMissing: z.boolean().optional(),
            alternateSlugs: z.record(z.string(), z.string()).optional(),
            translations: z.array(productAttributeValueTranslationSchema).optional(),
            parentValueId: z.uuid().nullable().optional(),
            assets: z.array(
                z.object({
                    id: z.uuid(),
                    key: z.string(),
                    mimeType: z.string(),
                    type: z.string(),
                    role: z.string(),
                    url: z.string(),
                }).loose()
            ).optional(),
        }).loose()
    )
}).loose()

export const listAttributesWithValuesResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(productAttributeFilterSchema)
            })
        })
    }).loose()
)
