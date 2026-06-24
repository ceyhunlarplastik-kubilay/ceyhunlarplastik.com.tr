import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { AssetRole, AssetType } from "@/prisma/generated/prisma/client"

export const createMaterialValidator = validatorWrapper(
    z.object({
        body: z.object({
            name: z.string().min(1),
            code: z.string().optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["name"],
    }
)

export const updateMaterialValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            name: z.string().min(1).optional(),
            code: z.string().optional(),
            assetKey: z.string().optional(),
            assetType: z.enum(AssetType).optional(),
            assetRole: z.enum(AssetRole).optional(),
            mimeType: z.string().optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    }
)

export const createMaterialAssetUploadValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            fileName: z.string().min(1),
            contentType: z.literal("application/pdf"),
            assetRole: z.enum(AssetRole).optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["fileName", "contentType"],
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
