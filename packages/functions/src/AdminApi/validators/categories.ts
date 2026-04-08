import { z } from "zod"
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
    code: z.number().optional(),
    name: z.string().optional(),
    slug: z.string().optional(),
    allowedAttributeValueIds: z.array(z.string()).optional(),
    assets: z.array(assetSchema).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
}).loose();

export const createCategoryValidator = validatorWrapper(
    z.object({
        body: z.object({
            code: z.coerce.number().int().positive(),
            name: z.string().min(2).max(100),
            allowedAttributeValueIds: z.array(z.uuid()).optional(),
            assetType: assetTypeEnum.optional(),
            assetRole: assetRoleEnum.optional(),
            assetKey: z.string().optional(),
            mimeType: z.string().optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["code", "name"],
    }
)

export const getCategoryValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        })
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const deleteCategoryValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        })
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

export const updateCategoryValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            name: z.string().min(2).max(100).optional(),
            allowedAttributeValueIds: z.array(z.uuid()).optional(),
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

export const createCategoryAssetUploadValidator = validatorWrapper(
    z.object({
        body: z.object({
            categorySlug: z.string().min(1),
            assetRole: assetRoleEnum,
            fileName: z.string().min(1),
            contentType: z.string().min(1),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["categorySlug", "assetRole", "fileName", "contentType"]
    }
)
