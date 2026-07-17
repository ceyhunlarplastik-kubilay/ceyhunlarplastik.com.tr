import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const localeSchema = z.enum(["tr", "en"])

const assetTypeEnum = z.enum([
    "IMAGE",
    "VIDEO",
    "PDF",
    "TECHNICAL_DRAWING",
    "CERTIFICATE",
]);

const assetRoleEnum = z.enum([
    "PRIMARY",
    "ANIMATION",
    "GALLERY",
    "DOCUMENT",
    "TECHNICAL_DRAWING",
    "MODEL_3D",
    "ASSEMBLY_VIDEO",
    "CERTIFICATE",
])

export const assetSchema = z.object({
    id: z.uuid(),
    key: z.string(),
    mimeType: z.string(),
    type: assetTypeEnum,
    role: assetRoleEnum,
    url: z.string(), // ✅ runtime generated
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const categorySchema = z.object({
    id: z.uuid(),
    code: z.number(),
    name: z.string(),
    slug: z.string(),
    locale: localeSchema,
    resolvedLocale: z.string(),
    translationMissing: z.boolean(),
    alternateSlugs: z.record(z.string(), z.string()),
    translations: z.array(z.object({
        id: z.uuid(),
        locale: z.string(),
        name: z.string(),
        slug: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })),
    allowedAttributeValueIds: z.array(z.string()).optional(),
    assets: z.array(assetSchema).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});


export const idValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        queryStringParameters: z.object({
            locale: localeSchema.optional(),
        }).optional(),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const slugValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            slug: z.string(),
        }),
        queryStringParameters: z.object({
            locale: localeSchema.optional(),
        }).optional(),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const listCategoriesValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            page: z.coerce.number().int().positive().optional(),
            limit: z.coerce.number().int().positive().max(500).optional(),
            search: z.string().trim().optional(),
            sort: z.enum(["code", "name", "createdAt"]).optional(),
            order: z.enum(["asc", "desc"]).optional(),
            locale: localeSchema.optional(),
        }).optional(),
    }).loose(),
    { requiredRootFields: [] },
)

// Response Validators
export const categoryResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                category: categorySchema
            })
        })
    }).loose()
)

export const listCategoryResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(categorySchema),
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
