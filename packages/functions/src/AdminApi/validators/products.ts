import { z } from "zod"
import { categorySchema } from "@/functions/AdminApi/validators/categories"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { assetTypeEnum, assetRoleEnum, productSchema } from "@/functions/PublicApi/validators/products"

/* const assetTypeEnum = z.enum([
    "IMAGE",
    "VIDEO",
    "PDF",
    "TECHNICAL_DRAWING",
    "CERTIFICATE",
]); */

/* const assetRoleEnum = z.enum([
    "PRIMARY",
    "ANIMATION",
    "GALLERY",
    "DOCUMENT",
    "TECHNICAL_DRAWING",
    "CERTIFICATE",
]) */

/* const attributeValueSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    attribute: z.object({
        id: z.uuid(),
        name: z.string(),
        code: z.string(),
    })
}) */

/* export const assetSchema = z.object({
    id: z.uuid(),
    key: z.string(),
    mimeType: z.string(),
    type: assetTypeEnum,
    role: assetRoleEnum,
    url: z.string(), // ✅ runtime generated
    createdAt: z.string(),
    updatedAt: z.string(),
}) */

// --- Shared Schemas ---
/* const productSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    slug: z.string().optional(),
    categoryId: z.uuid().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    category: categorySchema.optional(),
    assets: z.array(assetSchema).optional(),
    attributeValues: z.array(attributeValueSchema).optional(),
}).loose() */

/* ===========================
   REQUEST VALIDATORS
=========================== */

const productIndustrialUsageInputSchema = z.object({
    sectorValueId: z.uuid().nullable().optional(),
    productionGroupValueId: z.uuid().nullable().optional(),
    usageAreaValueId: z.uuid().nullable().optional(),
    usageFunction: z.string().max(2000).nullable().optional(),
    imageKey: z.string().max(2048).nullable().optional(),
    displayOrder: z.number().int().min(0).nullable().optional(),
})

const productAssetUploadPurposeEnum = z.enum([
    "PRODUCT_ASSET",
    "INDUSTRIAL_USAGE_IMAGE",
])

export const createProductValidator = validatorWrapper(
    z.object({
        body: z.object({
            code: z.string().min(1),
            name: z.string().min(1),
            description: z.string().optional(),
            categoryId: z.uuid(),
            assetType: assetTypeEnum.optional(),
            assetRole: assetRoleEnum.optional(),
            assetKey: z.string().optional(),
            mimeType: z.string().optional(),
            attributeValueIds: z.array(z.uuid()).optional(),
            industrialUsages: z.array(productIndustrialUsageInputSchema).max(100).optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["code", "name", "categoryId"],
    }
)

export const updateProductValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            code: z.string().min(1).optional(),
            name: z.string().min(1).optional(),
            description: z.string().optional(),
            categoryId: z.uuid().optional(),
            assetType: assetTypeEnum.optional(),
            assetRole: assetRoleEnum.optional(),
            assetKey: z.string().optional(),
            mimeType: z.string().optional(),
            attributeValueIds: z.array(z.uuid()).optional(),
            industrialUsages: z.array(productIndustrialUsageInputSchema).max(100).optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    }
)

export const idValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
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
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

/* ===========================
   RESPONSE VALIDATORS
=========================== */

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


export const createProductAssetUploadValidator = validatorWrapper(
    z.object({
        body: z.object({
            productSlug: z.string(),
            assetRole: z.enum([
                "PRIMARY",
                "ANIMATION",
                "GALLERY",
                "DOCUMENT",
                "TECHNICAL_DRAWING",
                "MODEL_3D",
                "ASSEMBLY_VIDEO",
                "CERTIFICATE",
            ]).optional(),
            fileName: z.string(),
            contentType: z.string(),
            purpose: productAssetUploadPurposeEnum.optional(),
        }).superRefine((body, ctx) => {
            const purpose = body.purpose ?? "PRODUCT_ASSET"

            if (purpose === "PRODUCT_ASSET" && !body.assetRole) {
                ctx.addIssue({
                    code: "custom",
                    path: ["assetRole"],
                    message: "assetRole is required for product asset uploads",
                })
            }

            if (purpose === "INDUSTRIAL_USAGE_IMAGE" && !body.contentType.startsWith("image/")) {
                ctx.addIssue({
                    code: "custom",
                    path: ["contentType"],
                    message: "Industrial usage uploads only accept image files",
                })
            }
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["productSlug", "fileName", "contentType"],
    }
)
