import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { assetTypeEnum, assetRoleEnum } from "@/functions/PublicApi/validators/products"

export const createProductAttributeValueValidator = validatorWrapper(
    z.object({
        body: z.object({
            name: z.string().min(1),
            attributeId: z.uuid(),
            displayOrder: z.number().optional(),
            parentValueId: z.uuid().nullable().optional(),
            assetType: assetTypeEnum.optional(),
            assetRole: assetRoleEnum.optional(),
            assetKey: z.string().optional(),
            mimeType: z.string().optional(),
        })
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["name", "attributeId"]
    }
)

export const updateProductAttributeValueValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid()
        }),
        body: z.object({
            name: z.string().optional(),
            displayOrder: z.number().optional(),
            parentValueId: z.uuid().nullable().optional(),
            assetType: assetTypeEnum.optional(),
            assetRole: assetRoleEnum.optional(),
            assetKey: z.string().optional(),
            mimeType: z.string().optional(),
        })
    }),
    {
        requiredRootFields: ["pathParameters", "body"]
    }
)

export const idValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid()
        })
    }),
    {
        requiredRootFields: ["pathParameters"]
    }
)

export const createProductAttributeValueAssetUploadValidator = validatorWrapper(
    z.object({
        body: z.object({
            productAttributeValueId: z.uuid(),
            assetRole: z.enum([
                "PRIMARY",
                "ANIMATION",
                "GALLERY",
                "DOCUMENT",
                "TECHNICAL_DRAWING",
                "MODEL_3D",
                "ASSEMBLY_VIDEO",
                "CERTIFICATE",
            ]),
            fileName: z.string(),
            contentType: z.string(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["productAttributeValueId", "assetRole", "fileName", "contentType"],
    }
)
