import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { AssetType, AssetRole } from "@/prisma/generated/prisma/client"

export const createAssetValidator = validatorWrapper(
    z.object({
        body: z.object({
            key: z.string().optional(),
            url: z.string().optional(),
            mimeType: z.string().optional(),
            type: z.enum(AssetType),
            role: z.enum(AssetRole).optional(),
            categoryId: z.uuid().optional(),
            productId: z.uuid().optional(),
            variantId: z.uuid().optional(),
            productAttributeValueId: z.uuid().optional(),
            materialId: z.uuid().optional(),
        })
            .refine((data) => Boolean(data.key || data.url), {
                message: "key or url is required",
                path: ["body"],
            })
            .refine((data) => {
                const defined = [data.categoryId, data.productId, data.variantId, data.productAttributeValueId, data.materialId].filter(Boolean).length;
                return defined === 1;
            }, {
                message: "Asset must belong to exactly one owner reference",
                path: ["body"],
            })
            .refine((data) => Boolean(data.mimeType), {
                message: "mimeType is required",
                path: ["body"],
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["type"],
    }
)

export const updateAssetValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            url: z.url().optional(),
            key: z.string().optional(),
            mimeType: z.string().optional(),
            type: z.enum(AssetType).optional(),
            role: z.enum(AssetRole).optional(),
            categoryId: z.uuid().optional(),
            productId: z.uuid().optional(),
            variantId: z.uuid().optional(),
            productAttributeValueId: z.uuid().optional(),
            materialId: z.uuid().optional(),
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

// Response Validators
// Asset modelinde url YOK; list/get category/product/variant/pav/material
// relation'larını include ediyor, create/update/delete bare Asset dönüyor.
// loose: include edilen relation objeleri (ve olası ekler) tolere edilsin;
// zorunlu alanlar her iki varyantta da bulunan scalar'lar.
const assetSchema = z.object({
    id: z.uuid(),
    key: z.string(),
    mimeType: z.string(),
    type: z.enum(AssetType),
    role: z.enum(AssetRole),
    categoryId: z.uuid().nullish(),
    productId: z.uuid().nullish(),
    variantId: z.uuid().nullish(),
    productAttributeValueId: z.uuid().nullish(),
    materialId: z.uuid().nullish(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

// getAsset / createAsset / updateAsset / deleteAsset → payload: { asset }
export const assetResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                asset: assetSchema,
            }),
        }),
    }).loose()
)

// listAssets → payload: { data, meta }
export const listAssetResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(assetSchema),
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
