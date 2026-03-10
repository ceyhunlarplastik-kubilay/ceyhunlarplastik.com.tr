import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

/* const assetTypeEnum = z.enum([
    "IMAGE",
    "VIDEO",
    "PDF",
    "TECHNICAL_DRAWING",
    "CERTIFICATE",
])

export const assetSchema = z.object({
    id: z.uuid(),
    key: z.string(),
    mimeType: z.string(),
    type: assetTypeEnum,
    isPrimary: z.boolean(),
    url: z.string(), // ✅ runtime generated
    createdAt: z.string(),
    updatedAt: z.string(),
}) 
    
export const categorySchema = z.object({
    id: z.uuid(),
    code: z.number(),
    name: z.string(),
    slug: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    assets: z.array(assetSchema).optional(),
}) */


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

export const categorySchema = z.object({
    id: z.uuid(),
    code: z.number(),
    name: z.string(),
    slug: z.string(),
    assets: z.array(assetSchema).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});


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
