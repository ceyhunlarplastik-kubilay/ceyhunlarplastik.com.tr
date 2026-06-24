import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"
import { assetRoleEnum, assetSchema, assetTypeEnum } from "@/functions/PublicApi/validators/products"

export const idValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

export const materialSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    code: z.string().nullable().optional(),
    assets: z.array(
        assetSchema.extend({
            type: assetTypeEnum,
            role: assetRoleEnum,
        }),
    ),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const getMaterialResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                material: materialSchema,
            }),
        }),
    }).loose(),
)

export const listMaterialsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(materialSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                }),
            }),
        }),
    }).loose(),
)
