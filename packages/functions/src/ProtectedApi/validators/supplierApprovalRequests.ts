import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const approvalRequestSchema = z.object({
    id: z.string(),
    type: z.enum(["SUPPLIER_PROFILE_UPDATE", "VARIANT_PRICING_UPDATE"]),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    supplierId: z.uuid(),
    productVariantSupplierId: z.uuid().nullable().optional(),
    requestedByUserId: z.uuid(),
    reviewedByUserId: z.uuid().nullable().optional(),
    workflowExecutionArn: z.string().nullable().optional(),
    requestPayload: z.any(),
    currentSnapshot: z.any().nullable().optional(),
    decisionNote: z.string().nullable().optional(),
    decidedAt: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    supplier: z.object({
        id: z.uuid(),
        name: z.string(),
    }).loose(),
    requestedByUser: z.object({
        id: z.uuid(),
        email: z.string(),
        identifier: z.string(),
    }).loose(),
    reviewedByUser: z.object({
        id: z.uuid(),
        email: z.string(),
        identifier: z.string(),
    }).loose().nullable().optional(),
    productVariantSupplier: z.object({
        id: z.uuid(),
        currency: z.string().optional(),
        variant: z.object({
            id: z.uuid(),
            name: z.string(),
            fullCode: z.string(),
            product: z.object({
                id: z.uuid(),
                code: z.string(),
                name: z.string(),
            }).loose(),
        }).loose(),
        supplier: z.object({
            id: z.uuid(),
            name: z.string(),
        }).loose(),
    }).loose().nullable().optional(),
}).loose()

export const listSupplierApprovalRequestsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(approvalRequestSchema),
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

export const supplierApprovalRequestResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                approvalRequest: approvalRequestSchema,
            }),
        }),
    }).loose()
)

export const decisionInputValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.string().min(1),
        }),
        body: z.object({
            approved: z.boolean(),
            note: z.string().max(2000).optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["approved"],
    }
)
