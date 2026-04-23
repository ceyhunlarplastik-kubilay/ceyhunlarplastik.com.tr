import { z } from "zod"

const productAttributeFilterSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    values: z.array(
        z.object({
            id: z.uuid(),
            name: z.string(),
            slug: z.string(),
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
        })
    ),
})

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
