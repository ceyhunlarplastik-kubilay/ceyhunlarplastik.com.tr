import { z } from "zod"

const customerValueSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    attributeId: z.uuid(),
    parentValueId: z.uuid().nullable().optional(),
    displayOrder: z.number().optional(),
    isActive: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    attribute: z
        .object({
            id: z.uuid(),
            code: z.string(),
            name: z.string(),
        })
        .optional(),
}).loose()

const customerSchema = z.object({
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
    sectorValue: customerValueSchema.nullable().optional(),
    productionGroupValue: customerValueSchema.nullable().optional(),
    usageAreaValues: z.array(customerValueSchema).optional(),
}).loose()

export const listCustomersResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(customerSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                }),
            }),
        }),
    }).loose()
)
