import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const invitationSummarySchema = z.object({
    email: z.string(),
    customerName: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    customerContactTitle: z.string().nullable().optional(),
    customerContactDepartment: z.string().nullable().optional(),
    isPrimaryCustomerContact: z.boolean(),
    expiresAt: z.string(),
}).loose()

export const getCustomerInvitationValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            token: z.string().trim().min(32).max(256),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

export const acceptCustomerInvitationValidator = validatorWrapper(
    z.object({
        body: z.object({
            token: z.string().trim().min(32).max(256),
            password: z.string().min(8).max(128),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["token", "password"],
    },
)

export const customerInvitationResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                invitation: invitationSummarySchema,
            }),
        }),
    }).loose(),
)

export const acceptCustomerInvitationResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                email: z.string(),
                customerName: z.string(),
            }),
        }),
    }).loose(),
)
