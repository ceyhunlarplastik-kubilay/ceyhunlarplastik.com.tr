import { z } from "zod"
import { categorySchema } from "@/functions/PublicApi/validators/categories";
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const localeSchema = z.enum(["tr", "en"])

export const assetTypeEnum = z.enum([
    "IMAGE",
    "VIDEO",
    "PDF",
    "TECHNICAL_DRAWING",
    "CERTIFICATE",
]);

export const assetRoleEnum = z.enum([
    "PRIMARY",
    "ANIMATION",
    "GALLERY",
    "DOCUMENT",
    "TECHNICAL_DRAWING",
    "MODEL_3D",
    "ASSEMBLY_VIDEO",
    "CERTIFICATE",
])

export const attributeValueSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    attributeId: z.uuid(),
    parentValueId: z.uuid().nullable().optional(),
    displayOrder: z.number(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    attribute: z.object({
        id: z.uuid(),
        code: z.string(),
        name: z.string(),
        displayOrder: z.number(),
        isActive: z.boolean(),
        createdAt: z.string(),
        updatedAt: z.string(),
    }).loose()
}).loose()

export const assetSchema = z.object({
    id: z.uuid(),
    key: z.string(),
    mimeType: z.string(),
    type: assetTypeEnum,
    role: assetRoleEnum,
    url: z.string(), // ✅ runtime generated
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

// industrialUsages değerleri bilinçli olarak slim taşınır (bkz. mapIndustrialUsageValue):
// derin attribute/parentValue zincirleri Lambda 6MB yanıt limitini aşıyordu.
export const industrialUsageValueSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    attribute: z.object({
        id: z.uuid(),
        code: z.string(),
        name: z.string(),
    }).nullable().optional(),
}).loose()

export const industrialUsageSchema = z.object({
    id: z.uuid(),
    productId: z.uuid(),
    sectorValueId: z.uuid().nullable().optional(),
    sectorValue: industrialUsageValueSchema.nullable().optional(),
    productionGroupValueId: z.uuid().nullable().optional(),
    productionGroupValue: industrialUsageValueSchema.nullable().optional(),
    usageAreaValueId: z.uuid().nullable().optional(),
    usageAreaValue: industrialUsageValueSchema.nullable().optional(),
    usageFunction: z.string().nullable().optional(),
    imageKey: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    displayOrder: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

// --- Shared Schemas ---
export const productSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    categoryId: z.uuid(),
    createdAt: z.string(),
    updatedAt: z.string(),
    category: categorySchema,
    assets: z.array(assetSchema),
    attributeValues: z.array(attributeValueSchema),
    industrialUsages: z.array(industrialUsageSchema).optional(),
}).loose()

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

/**
 * Variant-table route'ları (public + customer) için request validator.
 *
 * NEDEN AYRI: `idValidator`'ın `queryStringParameters` objesi KATI (`.loose()` yok)
 * → `z.toJSONSchema` `additionalProperties: false` üretiyor ve `validatorWrapper`
 * `additionalProperties: true`'yu yalnız KÖK şemaya uyguluyor. Bu route'ların
 * frontend çağrıları `limit=500` gönderdiği için istek 400 ile reddediliyordu
 * ("must NOT have additional properties: limit"). Sayfalama parametreleri burada
 * açıkça beyan edilir. Query string değerleri her zaman string gelir;
 * sayısal ayrıştırmayı `normalizeListQuery` yapar.
 */
export const productVariantTableRequestValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        queryStringParameters: z.object({
            locale: localeSchema.optional(),
            page: z.string().optional(),
            limit: z.string().optional(),
            search: z.string().optional(),
            sort: z.string().optional(),
            order: z.string().optional(),
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

// Response Validators
export const listProductsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(productSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                }),
            }),
        }),
    }).loose()
)

export const productResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                product: productSchema,
            }),
        }),
    }).loose()
)

export const productVariantTableResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(z.any()), // Can be refined later
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                    columns: z.array(z.string()),
                }),
            }),
        }),
    }).loose()
)
