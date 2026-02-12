/* import { z, ZodType } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const addUserToGroupValidator = validatorWrapper(
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
