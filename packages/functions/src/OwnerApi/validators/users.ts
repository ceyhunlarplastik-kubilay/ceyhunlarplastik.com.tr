import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const addUserToGroupValidator = validatorWrapper(
    z.object({
        body: z.object({
            group: z.enum(["owner", "admin", "user", "supplier", "purchasing", "sales", "sales_director", "customer"]),
            accessStatus: z.enum(["PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"]).optional(),
            supplierId: z.uuid().nullable().optional(),
            customerId: z.uuid().nullable().optional(),
            reason: z.string().trim().max(500).nullable().optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["group"],
    },
)
