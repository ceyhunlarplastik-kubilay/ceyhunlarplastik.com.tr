import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const businessRequestTypeValues = [
    "CUSTOMER_PROFILE_CHANGE",
    "CUSTOMER_ORDER_REQUEST",
    "CUSTOMER_DOCUMENT_REQUEST",
    "CUSTOMER_PRICING_REQUEST",
    "SUPPLIER_PROFILE_CHANGE",
    "SUPPLIER_PRICING_CHANGE",
    "SUPPLIER_CAPABILITY_CHANGE",
    "SUPPLIER_CATEGORY_CREATE",
    "SUPPLIER_PRODUCT_CREATE",
    "SUPPLIER_VARIANT_CREATE",
    "OFFER_DISCOUNT_REQUEST",
    "PAYMENT_TERM_REQUEST",
] as const

const businessRequestStatusValues = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "REJECTED",
    "CANCELLED",
    "COMPLETED",
    "FAILED",
] as const

const businessRequestDomainValues = ["SALES", "PURCHASING"] as const
const businessRequestEntityTypeValues = [
    "CUSTOMER",
    "CATEGORY",
    "SUPPLIER",
    "PRODUCT",
    "PRODUCT_VARIANT",
    "ORDER",
    "OFFER",
    "PAYMENT_TERM",
    "DOCUMENT",
    "OTHER",
] as const
const businessRequestPriorityValues = ["LOW", "NORMAL", "HIGH", "URGENT"] as const
const approvalRoleValues = ["CUSTOMER", "SUPPLIER", "SALES", "SALES_DIRECTOR", "PURCHASING", "ADMIN", "OWNER"] as const
const approvalStepStatusValues = ["PENDING", "APPROVED", "REJECTED", "SKIPPED"] as const

const businessRequestSchema = z.object({
    id: z.string(),
    domain: z.enum(businessRequestDomainValues),
    type: z.enum(businessRequestTypeValues),
    status: z.enum(businessRequestStatusValues),
    priority: z.enum(businessRequestPriorityValues),
    title: z.string(),
    description: z.string().nullable().optional(),
    entityType: z.enum(businessRequestEntityTypeValues).nullable().optional(),
    entityId: z.string().nullable().optional(),
    customerId: z.uuid().nullable().optional(),
    supplierId: z.uuid().nullable().optional(),
    requestedByUserId: z.uuid(),
    requesterRole: z.enum(approvalRoleValues),
    workflowExecutionArn: z.string().nullable().optional(),
    requestedData: z.any(),
    currentSnapshot: z.any().nullable().optional(),
    completedSnapshot: z.any().nullable().optional(),
    decidedAt: z.string().nullable().optional(),
    completedAt: z.string().nullable().optional(),
    cancelledAt: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    customer: z.object({
        id: z.uuid(),
        fullName: z.string(),
        companyName: z.string().nullable().optional(),
        assignedSalesUserId: z.uuid().nullable().optional(),
    }).loose().nullable().optional(),
    supplier: z.object({
        id: z.uuid(),
        name: z.string(),
        assignedPurchasingSuppliers: z.array(z.object({
            id: z.uuid(),
            email: z.string(),
            identifier: z.string(),
            firstName: z.string().nullable().optional(),
            lastName: z.string().nullable().optional(),
            groups: z.array(z.string()).optional(),
        }).loose()).optional(),
    }).loose().nullable().optional(),
    requestedByUser: z.object({
        id: z.uuid(),
        email: z.string(),
        identifier: z.string(),
        firstName: z.string().nullable().optional(),
        lastName: z.string().nullable().optional(),
        groups: z.array(z.string()).optional(),
    }).loose(),
    items: z.array(z.object({
        id: z.string(),
        requestId: z.string(),
        productVariantId: z.uuid().nullable().optional(),
        quantity: z.number(),
        note: z.string().nullable().optional(),
        data: z.any().nullable().optional(),
        displayOrder: z.number(),
    }).loose()).optional(),
    approvalSteps: z.array(z.object({
        id: z.string(),
        requestId: z.string(),
        stepOrder: z.number(),
        requiredRole: z.enum(approvalRoleValues),
        assignedUserId: z.uuid().nullable().optional(),
        status: z.enum(approvalStepStatusValues),
        decidedByUserId: z.uuid().nullable().optional(),
        decidedAt: z.string().nullable().optional(),
        decisionNote: z.string().nullable().optional(),
    }).loose()).optional(),
    activityLogs: z.array(z.object({
        id: z.string(),
        requestId: z.string().nullable().optional(),
        actorUserId: z.string().nullable().optional(),
        source: z.string(),
        eventType: z.string(),
        title: z.string(),
        description: z.string().nullable().optional(),
        data: z.any().nullable().optional(),
        createdAt: z.string(),
    }).loose()).optional(),
}).loose()

export const businessRequestResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                request: businessRequestSchema,
            }),
        }),
    }).loose()
)

export const businessRequestDecisionResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                accepted: z.boolean(),
                request: businessRequestSchema,
            }),
        }),
    }).loose()
)

export const businessRequestListResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(businessRequestSchema),
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

export const createPortalBusinessRequestValidator = validatorWrapper(
    z.object({
        body: z.object({
            type: z.enum([
                "CUSTOMER_PROFILE_CHANGE",
                "CUSTOMER_ORDER_REQUEST",
                "CUSTOMER_DOCUMENT_REQUEST",
                "CUSTOMER_PRICING_REQUEST",
            ]),
            title: z.string().trim().max(200).optional(),
            description: z.string().trim().max(5000).nullable().optional(),
            entityType: z.enum(businessRequestEntityTypeValues).nullable().optional(),
            entityId: z.string().trim().min(1).nullable().optional(),
            priority: z.enum(businessRequestPriorityValues).optional(),
            requestedData: z.record(z.string(), z.any()).nullable().optional(),
            items: z.array(z.object({
                productVariantId: z.uuid().nullable().optional(),
                quantity: z.number().int().positive().max(100000).optional(),
                note: z.string().trim().max(2000).nullable().optional(),
                data: z.record(z.string(), z.any()).nullable().optional(),
            })).max(500).optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["type"],
    }
)

export const createSupplierBusinessRequestValidator = validatorWrapper(
    z.object({
        body: z.object({
            type: z.enum([
                "SUPPLIER_CATEGORY_CREATE",
                "SUPPLIER_PRODUCT_CREATE",
                "SUPPLIER_VARIANT_CREATE",
            ]),
            title: z.string().trim().max(200).optional(),
            description: z.string().trim().max(5000).nullable().optional(),
            priority: z.enum(businessRequestPriorityValues).optional(),
            requestedData: z.record(z.string(), z.any()),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["type", "requestedData"],
    }
)

export const listBusinessRequestsValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            page: z.coerce.number().int().positive().optional(),
            limit: z.coerce.number().int().positive().max(100).optional(),
            search: z.string().trim().optional(),
            sort: z.string().trim().optional(),
            order: z.enum(["asc", "desc"]).optional(),
            status: z.enum(businessRequestStatusValues).optional(),
            type: z.enum(businessRequestTypeValues).optional(),
            domain: z.enum(businessRequestDomainValues).optional(),
        }).optional(),
    }).loose(),
    {
        requiredRootFields: [],
    },
)

export const decideBusinessRequestValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.string().min(1),
        }),
        body: z.object({
            approved: z.boolean().optional(),
            action: z.enum(["APPROVE", "REJECT", "COUNTER"]).optional(),
            note: z.string().trim().max(2000).optional(),
            counterOfferItems: z.array(z.object({
                requestItemId: z.string().min(1),
                proposedUnitPrice: z.number().positive().max(1000000000),
                currency: z.string().trim().max(12).nullable().optional(),
            })).max(500).optional(),
        }).superRefine((body, ctx) => {
            const action = body.action ?? (body.approved === false ? "REJECT" : "APPROVE")

            if (action === "COUNTER" && (!body.counterOfferItems || body.counterOfferItems.length === 0)) {
                ctx.addIssue({
                    code: "custom",
                    message: "Karşı teklif için en az bir kalem fiyatı gerekli.",
                    path: ["counterOfferItems"],
                })
            }

            if (!body.action && body.approved === undefined) {
                ctx.addIssue({
                    code: "custom",
                    message: "approved veya action alanı gerekli.",
                    path: ["approved"],
                })
            }
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: [],
    }
)
