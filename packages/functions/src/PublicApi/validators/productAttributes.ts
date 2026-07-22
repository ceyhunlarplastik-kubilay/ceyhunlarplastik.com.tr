import { z } from "zod"

const localeSchema = z.enum(["tr", "en"])
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

const productAttributeFilterSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    locale: localeSchema.optional(),
    resolvedLocale: z.string().optional(),
    translationMissing: z.boolean().optional(),
    translations: z.array(productAttributeTranslationSchema).optional(),
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
    ),
}).loose()

export const listAttributesWithValuesResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(productAttributeFilterSchema),
            }),
        }),
    }).loose()
)
