import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const nullableTrimmedText = (max: number) =>
    z.string().trim().max(max).nullable().optional()

const companyContactWriteBaseSchema = z.object({
    department: z.string().trim().min(2).max(120),
    name: z.string().trim().min(2).max(160),
    roleLabel: nullableTrimmedText(120),
    email: z.email().nullable().optional(),
    phone: nullableTrimmedText(50),
    whatsappPhone: nullableTrimmedText(50),
    note: nullableTrimmedText(2000),
    isActive: z.boolean().optional(),
    displayOrder: z.number().int().min(0).optional(),
})

const companyContactWriteSchema = companyContactWriteBaseSchema.superRefine((value, ctx) => {
    if (value.email || value.phone || value.whatsappPhone) return

    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "En az bir iletişim kanalı girilmelidir.",
    })
})

const companyContactSchema = z.object({
    id: z.uuid(),
    department: z.string(),
    name: z.string(),
    roleLabel: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    whatsappPhone: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    isActive: z.boolean(),
    displayOrder: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const createCompanyContactValidator = validatorWrapper(
    z.object({
        body: companyContactWriteSchema,
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["department", "name"],
    },
)

export const updateCompanyContactValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: companyContactWriteBaseSchema.partial().superRefine((value, ctx) => {
            if (value.email === undefined && value.phone === undefined && value.whatsappPhone === undefined) return
            if (value.email || value.phone || value.whatsappPhone) return

            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["phone"],
                message: "En az bir iletişim kanalı girilmelidir.",
            })
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    },
)

export const companyContactIdValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

export const companyContactResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                companyContact: companyContactSchema,
            }),
        }),
    }).loose(),
)

export const listCompanyContactsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(companyContactSchema),
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
