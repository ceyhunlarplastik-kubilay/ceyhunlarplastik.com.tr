import { z } from "zod"
import { categorySchema } from "@/functions/AdminApi/validators/categories"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

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

// --- Shared Schemas ---
const productSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    slug: z.string().optional(),
    categoryId: z.uuid().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    category: categorySchema.optional(),
    assets: z.array(assetSchema).optional(),
}).loose();

/* ===========================
   REQUEST VALIDATORS
=========================== */

export const createProductValidator = validatorWrapper(
    z.object({
        body: z.object({
            code: z.string().min(1),
            name: z.string().min(1),
            categoryId: z.uuid(),
            assetType: assetTypeEnum.optional(),
            assetRole: assetRoleEnum.optional(),
            assetKey: z.string().optional(),
            mimeType: z.string().optional(),
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
            categoryId: z.uuid().optional(),
            assetType: assetTypeEnum.optional(),
            assetRole: assetRoleEnum.optional(),
            assetKey: z.string().optional(),
            mimeType: z.string().optional(),
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
                "CERTIFICATE",
            ]),
            fileName: z.string(),
            contentType: z.string(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["productSlug", "assetRole", "fileName", "contentType"],
    }
)