import { z } from "zod";
import { categorySchema } from "@/functions/PublicApi/validators/categories";
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper";
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
]);
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
}).loose();
export const assetSchema = z.object({
    id: z.uuid(),
    key: z.string(),
    mimeType: z.string(),
    type: assetTypeEnum,
    role: assetRoleEnum,
    url: z.string(), // ✅ runtime generated
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose();
export const industrialUsageSchema = z.object({
    id: z.uuid(),
    productId: z.uuid(),
    sectorValueId: z.uuid().nullable().optional(),
    sectorValue: attributeValueSchema.nullable().optional(),
    productionGroupValueId: z.uuid().nullable().optional(),
    productionGroupValue: attributeValueSchema.nullable().optional(),
    usageAreaValueId: z.uuid().nullable().optional(),
    usageAreaValue: attributeValueSchema.nullable().optional(),
    usageFunction: z.string().nullable().optional(),
    imageKey: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    displayOrder: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose();
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
}).loose();
export const idValidator = validatorWrapper(z.object({
    pathParameters: z.object({
        id: z.uuid(),
    }),
}), {
    requiredRootFields: ["pathParameters"],
});
export const slugValidator = validatorWrapper(z.object({
    pathParameters: z.object({
        slug: z.string(),
    }),
}), {
    requiredRootFields: ["pathParameters"],
});
// Response Validators
export const listProductsResponseValidator = z.toJSONSchema(z.object({
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
}).loose());
export const productResponseValidator = z.toJSONSchema(z.object({
    statusCode: z.number(),
    body: z.object({
        statusCode: z.number(),
        payload: z.object({
            product: productSchema,
        }),
    }),
}).loose());
export const productVariantTableResponseValidator = z.toJSONSchema(z.object({
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
}).loose());
