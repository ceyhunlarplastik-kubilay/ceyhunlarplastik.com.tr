import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const createCustomerValidator = validatorWrapper(
    z.object({
        body: z.object({
            companyName: z.string().min(2).max(200).optional(),
            fullName: z.string().min(2).max(200),
            phone: z.string().min(7).max(40),
            email: z.email().max(320),
            note: z.string().max(5000).optional(),
            sectorValueId: z.uuid().optional(),
            productionGroupValueId: z.uuid().optional(),
            usageAreaValueIds: z.array(z.uuid()).optional(),
        })
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["fullName", "phone", "email"],
    }
)

const customerResponseSchema = z.object({
    id: z.uuid(),
    companyName: z.string().nullable().optional(),
    fullName: z.string(),
    phone: z.string(),
    email: z.string(),
    note: z.string().nullable().optional(),
    sectorValueId: z.uuid().nullable().optional(),
    productionGroupValueId: z.uuid().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const customerResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                customer: customerResponseSchema,
            }),
        }),
    }).loose()
)
