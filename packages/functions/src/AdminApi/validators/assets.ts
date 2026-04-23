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
        })
            .refine((data) => Boolean(data.key || data.url), {
                message: "key or url is required",
                path: ["body"],
            })
            .refine((data) => {
                const defined = [data.categoryId, data.productId, data.variantId, data.productAttributeValueId].filter(Boolean).length;
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
