import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const addUserToGroupValidator = validatorWrapper(
    z.object({
        body: z.object({
            group: z.enum(["owner", "admin", "user", "supplier", "purchasing", "sales"]),
            supplierId: z.uuid().nullable().optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["group"],
    },
)
