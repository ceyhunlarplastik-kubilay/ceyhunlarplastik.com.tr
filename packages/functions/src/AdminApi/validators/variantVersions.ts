import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const variantVersionSchema = z.object({
    id: z.string(),
    code: z.number(),
    colorId: z.string().nullable(),
    color: z.object({
        id: z.string(),
        name: z.string(),
        code: z.string(),
        system: z.string(),
        hex: z.string(),
    }).loose().nullable(),
    materials: z.array(z.object({
        id: z.string(),
        name: z.string(),
        code: z.string().nullable(),
    }).loose()),
    variantCount: z.number(),
    createdAt: z.string(),
}).loose()

export const listVariantVersionsValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const createVariantVersionValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            colorId: z.uuid().optional(),
            materialIds: z.array(z.uuid()).max(12).optional(),
            // Önden tanımlarken numarayı istemci seçebilir.
            code: z.number().int().min(1).max(9999).optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    }
)

export const variantVersionIdValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
            versionId: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const listVariantVersionsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                versions: z.array(variantVersionSchema),
                nextCode: z.number(),
            }),
        }),
    }).loose()
)

export const variantVersionResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({ version: variantVersionSchema }),
        }),
    }).loose()
)

export const deleteVariantVersionResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({ deletedId: z.string() }),
        }),
    }).loose()
)
