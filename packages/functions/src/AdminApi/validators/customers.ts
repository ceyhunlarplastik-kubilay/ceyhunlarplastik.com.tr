import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const userSummarySchema = z.object({
    id: z.uuid(),
    email: z.string(),
    identifier: z.string(),
    groups: z.array(z.string()).optional(),
}).loose()

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
    attribute: z.object({
        id: z.uuid(),
        code: z.string(),
        name: z.string(),
    }).loose().optional(),
}).loose()

const featuredProductSchema = z.object({
    id: z.uuid(),
    customerId: z.uuid(),
    productId: z.uuid(),
    displayOrder: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    createdByUserId: z.uuid(),
    createdByUser: userSummarySchema.optional(),
    product: z.object({
        id: z.uuid(),
        code: z.string(),
        name: z.string(),
        slug: z.string(),
        description: z.string().nullable().optional(),
        categoryId: z.uuid(),
        createdAt: z.string(),
        updatedAt: z.string(),
        category: z.object({
            id: z.uuid(),
            code: z.number(),
            name: z.string(),
            slug: z.string(),
        }).loose().optional(),
        assets: z.array(z.object({
            id: z.uuid(),
            key: z.string(),
            mimeType: z.string(),
            type: z.string(),
            role: z.string(),
        }).loose()).optional(),
        attributeValues: z.array(customerValueSchema).optional(),
    }).loose(),
}).loose()

const customerVisitSchema = z.object({
    id: z.uuid(),
    customerId: z.uuid(),
    ownerUserId: z.uuid(),
    scheduledAt: z.string(),
    status: z.enum(["PLANNED", "COMPLETED", "CANCELED"]),
    title: z.string(),
    note: z.string().nullable().optional(),
    completedAt: z.string().nullable().optional(),
    createdByUserId: z.uuid(),
    createdAt: z.string(),
    updatedAt: z.string(),
    ownerUser: userSummarySchema.optional(),
    createdByUser: userSummarySchema.optional(),
}).loose()

const customerAddressSchema = z.object({
    id: z.uuid(),
    customerId: z.uuid(),
    label: z.string(),
    contactName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    country: z.string(),
    city: z.string(),
    district: z.string().nullable().optional(),
    line1: z.string(),
    line2: z.string().nullable().optional(),
    postalCode: z.string().nullable().optional(),
    taxOffice: z.string().nullable().optional(),
    isPrimary: z.boolean(),
    isBilling: z.boolean(),
    isShipping: z.boolean(),
    note: z.string().nullable().optional(),
    displayOrder: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

const customerSchema = z.object({
    id: z.uuid(),
    companyName: z.string().nullable().optional(),
    fullName: z.string(),
    phone: z.string(),
    email: z.string(),
    note: z.string().nullable().optional(),
    status: z.enum(["LEAD", "CUSTOMER"]),
    assignedSalesUserId: z.uuid().nullable().optional(),
    convertedAt: z.string().nullable().optional(),
    convertedByUserId: z.uuid().nullable().optional(),
    sectorValueId: z.uuid().nullable().optional(),
    productionGroupValueId: z.uuid().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    sectorValue: customerValueSchema.nullable().optional(),
    productionGroupValue: customerValueSchema.nullable().optional(),
    usageAreaValues: z.array(customerValueSchema).optional(),
    assignedSalesUser: userSummarySchema.nullable().optional(),
    convertedByUser: userSummarySchema.nullable().optional(),
    featuredProducts: z.array(featuredProductSchema).optional(),
    assignedProducts: z.array(featuredProductSchema).optional(),
    addresses: z.array(customerAddressSchema).optional(),
    visits: z.array(customerVisitSchema).optional(),
}).loose()

export const customerIdValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

export const customerVisitIdValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
            visitId: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

export const updateCustomerValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            companyName: z.string().trim().max(255).nullable().optional(),
            fullName: z.string().trim().min(2).max(255).optional(),
            phone: z.string().trim().min(5).max(50).optional(),
            email: z.email().optional(),
            note: z.string().trim().max(5000).nullable().optional(),
            status: z.enum(["LEAD", "CUSTOMER"]).optional(),
            assignedSalesUserId: z.uuid().nullable().optional(),
            sectorValueId: z.uuid().nullable().optional(),
            productionGroupValueId: z.uuid().nullable().optional(),
            usageAreaValueIds: z.array(z.uuid()).max(30).optional(),
            addresses: z.array(z.object({
                label: z.string().trim().min(2).max(120),
                contactName: z.string().trim().max(120).nullable().optional(),
                phone: z.string().trim().max(50).nullable().optional(),
                email: z.email().nullable().optional(),
                country: z.string().trim().min(2).max(80).nullable().optional(),
                city: z.string().trim().min(2).max(120),
                district: z.string().trim().max(120).nullable().optional(),
                line1: z.string().trim().min(5).max(255),
                line2: z.string().trim().max(255).nullable().optional(),
                postalCode: z.string().trim().max(20).nullable().optional(),
                taxOffice: z.string().trim().max(120).nullable().optional(),
                isPrimary: z.boolean().optional(),
                isBilling: z.boolean().optional(),
                isShipping: z.boolean().optional(),
                note: z.string().trim().max(1000).nullable().optional(),
            })).max(10).optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    },
)

export const replaceCustomerFeaturedProductsValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            productIds: z.array(z.uuid()).max(50),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["productIds"],
    },
)

export const replaceCustomerAssignedProductsValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            productIds: z.array(z.uuid()).max(50),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["productIds"],
    },
)

export const createCustomerVisitValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            ownerUserId: z.uuid(),
            scheduledAt: z.iso.datetime(),
            title: z.string().trim().min(2).max(255),
            note: z.string().trim().max(5000).nullable().optional(),
            status: z.enum(["PLANNED", "COMPLETED", "CANCELED"]).optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["ownerUserId", "scheduledAt", "title"],
    },
)

export const updateCustomerVisitValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
            visitId: z.uuid(),
        }),
        body: z.object({
            ownerUserId: z.uuid().optional(),
            scheduledAt: z.iso.datetime().optional(),
            title: z.string().trim().min(2).max(255).optional(),
            note: z.string().trim().max(5000).nullable().optional(),
            status: z.enum(["PLANNED", "COMPLETED", "CANCELED"]).optional(),
            completedAt: z.iso.datetime().nullable().optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    },
)

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
    }).loose(),
)

export const customerResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                customer: customerSchema,
            }),
        }),
    }).loose(),
)

export const customerFeaturedProductsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(featuredProductSchema),
            }),
        }),
    }).loose(),
)

export const customerAssignedProductsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(featuredProductSchema),
            }),
        }),
    }).loose(),
)

export const customerVisitsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(customerVisitSchema),
            }),
        }),
    }).loose(),
)

export const customerVisitResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                visit: customerVisitSchema,
            }),
        }),
    }).loose(),
)
