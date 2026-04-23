import { z, ZodType } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

/* export const addUserToGroupValidator = validatorWrapper(
    z.object({
        body: z.object({
            group: z.enum(["owner", "admin", "user", "supplier"]),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["group"],
    },
) */

export const listUsersResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(
                    z.object({
                        id: z.uuid(),
                        email: z.string(),
                        identifier: z.string(),
                        groups: z.array(z.string()),
                        supplierId: z.uuid().nullable().optional(),
                        isActive: z.boolean(),
                        createdAt: z.string(),
                        updatedAt: z.string(),
                    }).loose()
                ),
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

export const getUserResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                user: z.object({
                    id: z.uuid(),
                    email: z.string(),
                    identifier: z.string(),
                    groups: z.array(z.string()),
                    supplierId: z.uuid().nullable().optional(),
                    isActive: z.boolean(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                }).loose()
            })
        })
    }).loose()
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

export const updateUserSupplierValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            supplierId: z.uuid().nullable().optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    }
)

export const updateUserSupplierResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                user: z.object({
                    id: z.uuid(),
                    email: z.string(),
                    identifier: z.string(),
                    groups: z.array(z.string()),
                    supplierId: z.uuid().nullable().optional(),
                    isActive: z.boolean(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                }).loose()
            })
        })
    }).loose()
)
