import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { AssetType } from "@/prisma/generated/prisma/client"

export const createAssetValidator = validatorWrapper(
    z.object({
        body: z.object({
            url: z.url(),
            type: z.enum(AssetType),
            categoryId: z.uuid().optional(),
            productId: z.uuid().optional(),
            variantId: z.uuid().optional(),
        }).refine((data) => {
            const defined = [data.categoryId, data.productId, data.variantId].filter(Boolean).length;
            return defined === 1;
        }, {
            message: "Asset must belong to exactly one of: Category, Product, or Variant",
            path: ["body"],
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["url", "type"],
    }
)

export const updateAssetValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            url: z.url().optional(),
            type: z.enum(AssetType).optional(),
            categoryId: z.uuid().optional(),
            productId: z.uuid().optional(),
            variantId: z.uuid().optional(),
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
