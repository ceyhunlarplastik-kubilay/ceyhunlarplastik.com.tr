import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const assignmentFilterSchema = z.enum(["all", "assigned", "unassigned"])

const hierarchyValueSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    parentValueId: z.uuid().nullable(),
    displayOrder: z.number(),
    isActive: z.boolean(),
    attribute: z.object({
        id: z.uuid(),
        code: z.string(),
        name: z.string(),
    }).nullable(),
})

const assignmentProductSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    slug: z.string(),
    category: z.object({
        id: z.uuid(),
        name: z.string(),
        slug: z.string(),
        code: z.number(),
    }).nullable(),
    primaryImageUrl: z.string().nullable(),
    isAssigned: z.boolean(),
    assignedUsageId: z.uuid().nullable(),
    industrialUsageCount: z.number(),
})

export const listIndustrialUsageAssignmentProductsValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            usageAreaValueId: z.uuid(),
        }),
        queryStringParameters: z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            search: z.string().optional(),
            assignment: assignmentFilterSchema.optional(),
        }).optional(),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

export const patchIndustrialUsageAssignmentProductsValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            usageAreaValueId: z.uuid(),
        }),
        body: z.object({
            addProductIds: z.array(z.uuid()).optional(),
            removeProductIds: z.array(z.uuid()).optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    },
)

export const listIndustrialUsageAssignmentProductsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                hierarchy: z.object({
                    sector: hierarchyValueSchema,
                    productionGroup: hierarchyValueSchema,
                    usageArea: hierarchyValueSchema,
                }),
                assignedTotal: z.number(),
                data: z.array(assignmentProductSchema),
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

export const patchIndustrialUsageAssignmentProductsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                hierarchy: z.object({
                    sector: hierarchyValueSchema,
                    productionGroup: hierarchyValueSchema,
                    usageArea: hierarchyValueSchema,
                }),
                added: z.number(),
                removed: z.number(),
                kept: z.number(),
                assignedTotal: z.number(),
            }),
        }),
    }).loose(),
)
