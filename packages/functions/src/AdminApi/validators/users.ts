import { z, ZodType } from "zod"
// import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

/* export const addUserToGroupValidator = validatorWrapper(
    z.object({
        body: z.object({
            group: z.enum(["owner", "admin", "user"]),
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
                        createdAt: z.string(),
                        updatedAt: z.string(),
                    })
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
