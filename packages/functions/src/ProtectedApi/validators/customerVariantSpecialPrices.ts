import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional()
const nullableDate = z.string().trim().max(40).nullable().optional()

const paymentScheduleStepSchema = z.object({
    percentage: z.number().positive().max(100),
    paymentTermDays: z.number().int().min(0).max(3650),
    label: z.string().trim().min(1).max(80),
    note: z.string().trim().max(500).nullable().optional(),
}).loose()

const paymentScheduleSchema = z.array(paymentScheduleStepSchema).max(12).nullable().optional()

const specialPriceBodySchema = z.object({
    productVariantId: z.uuid().optional(),
    price: z.number().positive().max(1000000000).optional(),
    currency: z.string().trim().min(1).max(12).optional(),
    minOrderQuantity: z.number().int().positive().max(100000000).nullable().optional(),
    maxOrderQuantity: z.number().int().positive().max(100000000).nullable().optional(),
    paymentTermDays: z.number().int().min(0).max(3650).nullable().optional(),
    paymentTermLabel: nullableText(80),
    paymentSchedule: paymentScheduleSchema,
    validFrom: nullableDate,
    validUntil: nullableDate,
    taxIncluded: z.boolean().optional(),
    deliveryTerm: nullableText(255),
    contractReference: nullableText(120),
    note: nullableText(5000),
    internalNote: nullableText(5000),
    isActive: z.boolean().optional(),
}).superRefine((body, ctx) => {
    if (
        body.minOrderQuantity !== null
        && body.minOrderQuantity !== undefined
        && body.maxOrderQuantity !== null
        && body.maxOrderQuantity !== undefined
        && body.maxOrderQuantity < body.minOrderQuantity
    ) {
        ctx.addIssue({
            code: "custom",
            path: ["maxOrderQuantity"],
            message: "Maksimum sipariş adedi minimum sipariş adedinden küçük olamaz.",
        })
    }

    if (Array.isArray(body.paymentSchedule) && body.paymentSchedule.length > 0) {
        const totalPercentage = body.paymentSchedule.reduce((sum, step) => sum + step.percentage, 0)
        if (Math.abs(totalPercentage - 100) > 0.01) {
            ctx.addIssue({
                code: "custom",
                path: ["paymentSchedule"],
                message: "Ödeme planı adımlarının yüzde toplamı 100 olmalı.",
            })
        }
    }

    const validFrom = body.validFrom ? new Date(body.validFrom) : null
    const validUntil = body.validUntil ? new Date(body.validUntil) : null

    if (validFrom && Number.isNaN(validFrom.getTime())) {
        ctx.addIssue({
            code: "custom",
            path: ["validFrom"],
            message: "Geçerlilik başlangıç tarihi geçerli değil.",
        })
    }

    if (validUntil && Number.isNaN(validUntil.getTime())) {
        ctx.addIssue({
            code: "custom",
            path: ["validUntil"],
            message: "Geçerlilik bitiş tarihi geçerli değil.",
        })
    }

    if (
        validFrom
        && validUntil
        && !Number.isNaN(validFrom.getTime())
        && !Number.isNaN(validUntil.getTime())
        && validUntil.getTime() < validFrom.getTime()
    ) {
        ctx.addIssue({
            code: "custom",
            path: ["validUntil"],
            message: "Geçerlilik bitiş tarihi başlangıçtan önce olamaz.",
        })
    }
}).loose()

const pricingSchema = z.object({
    listPrice: z.number().nullable(),
    finalPrice: z.number().nullable(),
    currency: z.string(),
    priceSource: z.enum(["CUSTOMER_SPECIAL_PRICE", "CUSTOMER_GENERAL_DISCOUNT", "LIST_PRICE"]),
    appliedDiscountPercent: z.number(),
    specialPriceId: z.string().nullable(),
    minOrderQuantity: z.number().nullable(),
    maxOrderQuantity: z.number().nullable(),
    paymentTermDays: z.number().nullable(),
    paymentTermLabel: z.string().nullable(),
    paymentSchedule: z.array(paymentScheduleStepSchema).nullable(),
    validFrom: z.string().nullable(),
    validUntil: z.string().nullable(),
    taxIncluded: z.boolean(),
    deliveryTerm: z.string().nullable(),
    contractReference: z.string().nullable(),
    note: z.string().nullable(),
    specialPriceApplied: z.boolean(),
    specialPriceEligible: z.boolean().nullable(),
    ineligibilityReason: z.string().nullable(),
}).loose()

const specialPriceSchema = z.object({
    id: z.uuid(),
    customerId: z.uuid(),
    productVariantId: z.uuid(),
    price: z.number().nullable(),
    currency: z.string(),
    minOrderQuantity: z.number().nullable(),
    maxOrderQuantity: z.number().nullable(),
    paymentTermDays: z.number().nullable(),
    paymentTermLabel: z.string().nullable(),
    paymentSchedule: z.array(paymentScheduleStepSchema).nullable(),
    validFrom: z.string().nullable(),
    validUntil: z.string().nullable(),
    taxIncluded: z.boolean(),
    deliveryTerm: z.string().nullable(),
    contractReference: z.string().nullable(),
    note: z.string().nullable(),
    internalNote: z.string().nullable().optional(),
    isActive: z.boolean(),
    approvedAt: z.string().nullable(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    customer: z.any().nullable().optional(),
    productVariant: z.any().nullable().optional(),
    createdByUser: z.any().nullable().optional(),
    approvedByUser: z.any().nullable().optional(),
    pricing: pricingSchema,
}).loose()

export const customerSpecialPriceIdValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
            specialPriceId: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

export const customerSpecialPriceListValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        queryStringParameters: z.object({
            page: z.coerce.number().int().positive().optional(),
            limit: z.coerce.number().int().positive().max(100).optional(),
            search: z.string().trim().optional(),
            sort: z.string().trim().optional(),
            order: z.enum(["asc", "desc"]).optional(),
            isActive: z.coerce.boolean().optional(),
        }).optional(),
    }).loose(),
    {
        requiredRootFields: ["pathParameters"],
    },
)

export const portalSpecialPriceListValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            page: z.coerce.number().int().positive().optional(),
            limit: z.coerce.number().int().positive().max(100).optional(),
            search: z.string().trim().optional(),
            sort: z.string().trim().optional(),
            order: z.enum(["asc", "desc"]).optional(),
        }).optional(),
    }).loose(),
    {
        requiredRootFields: [],
    },
)

export const createCustomerSpecialPriceValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: specialPriceBodySchema.required({
            productVariantId: true,
            price: true,
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["productVariantId", "price"],
    },
)

export const updateCustomerSpecialPriceValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
            specialPriceId: z.uuid(),
        }),
        body: specialPriceBodySchema,
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    },
)

export const customerSpecialPriceResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                specialPrice: specialPriceSchema,
            }),
        }),
    }).loose(),
)

export const customerSpecialPriceListResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(specialPriceSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                }).optional(),
            }),
        }),
    }).loose(),
)
