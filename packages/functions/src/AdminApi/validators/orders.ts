import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const userSummarySchema = z.object({
    id: z.string(),
    email: z.string().nullable().optional(),
    identifier: z.string().nullable().optional(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
}).loose()

const customerSummarySchema = z.object({
    id: z.string(),
    companyName: z.string().nullable().optional(),
    fullName: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    assignedSalesUserId: z.string().nullable().optional(),
    assignedSalesUser: userSummarySchema.nullable().optional(),
}).loose()

const orderItemSchema = z.object({
    id: z.string().optional(),
    quantity: z.number().int().optional(),
    currency: z.string().optional(),
    data: z.any().nullable().optional(),
    productVariant: z.object({
        id: z.string().optional(),
        name: z.string().nullable().optional(),
        fullCode: z.string().nullable().optional(),
        versionCode: z.string().nullable().optional(),
        product: z.object({
            id: z.string().optional(),
            name: z.string().nullable().optional(),
            code: z.string().nullable().optional(),
            slug: z.string().nullable().optional(),
            assets: z.array(z.any()).optional(),
        }).loose().nullable().optional(),
    }).loose().nullable().optional(),
}).loose()

const orderSchema = z.object({
    id: z.string(),
    orderNumber: z.string(),
    status: z.enum(["APPROVED", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "COMPLETED", "CANCELLED"]),
    title: z.string(),
    customerId: z.string(),
    requestedByUserId: z.string().nullable().optional(),
    sourceRequestId: z.string().nullable().optional(),
    shippingAddressId: z.string().nullable().optional(),
    shippingAddressLabel: z.string().nullable().optional(),
    shippingAddressSnapshot: z.unknown().optional(),
    referenceCode: z.string().nullable().optional(),
    currency: z.string(),
    totalQuantity: z.number().int(),
    discountPercent: z.number().nullable().optional(),
    listSubtotal: z.number().nullable().optional(),
    customerSubtotal: z.number().nullable().optional(),
    requestedDeliveryDate: z.string().nullable().optional(),
    paymentTermDays: z.number().int().nullable().optional(),
    paymentTermNote: z.string().nullable().optional(),
    commercialNote: z.string().nullable().optional(),
    negotiationNote: z.string().nullable().optional(),
    approvedFromRequestAt: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    customer: customerSummarySchema.nullable().optional(),
    requestedByUser: userSummarySchema.nullable().optional(),
    shippingAddress: z.any().nullable().optional(),
    sourceRequest: z.any().nullable().optional(),
    items: z.array(orderItemSchema).optional(),
}).loose()

export const listOrdersQueryValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            search: z.string().optional(),
            sort: z.string().optional(),
            order: z.enum(["asc", "desc"]).optional(),
            status: z.enum(["APPROVED", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "COMPLETED", "CANCELLED"]).optional(),
        }).partial().optional(),
    }),
    {
        requiredRootFields: [],
    },
)

export const listOrdersResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(orderSchema),
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
