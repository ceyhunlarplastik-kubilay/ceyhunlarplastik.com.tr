import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const userSummarySchema = z.object({
    id: z.uuid(),
    email: z.string(),
    identifier: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    groups: z.array(z.string()).optional(),
    phone: z.string().nullable().optional(),
    imageKey: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    customerContactTitle: z.string().nullable().optional(),
    customerContactDepartment: z.string().nullable().optional(),
    isPrimaryCustomerContact: z.boolean().optional(),
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
    assets: z.array(z.object({
        id: z.uuid(),
        key: z.string(),
        mimeType: z.string(),
        type: z.string(),
        role: z.string(),
        url: z.string().optional(),
    }).loose()).optional(),
}).loose()

const customerAttributeAssignmentSchema = z.object({
    id: z.uuid(),
    customerId: z.uuid(),
    attributeValueId: z.uuid(),
    source: z.enum(["MANUAL", "LEGACY_BACKFILL", "SYSTEM"]),
    createdAt: z.string(),
    updatedAt: z.string(),
    attributeValue: customerValueSchema,
}).loose()

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

const customerCompanyContactAssignmentSchema = z.object({
    id: z.uuid(),
    customerId: z.uuid(),
    companyContactId: z.uuid(),
    isActive: z.boolean(),
    displayOrder: z.number(),
    note: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    companyContact: companyContactSchema,
}).loose()

const featuredProductSchema = z.object({
    id: z.uuid(),
    customerId: z.uuid(),
    productId: z.uuid(),
    displayOrder: z.number(),
    source: z.enum(["MANUAL", "ATTRIBUTE_MATCH"]).optional(),
    isProfileMatched: z.boolean().optional(),
    matchedAttributeValueIds: z.array(z.uuid()).optional(),
    matchedAttributeLabels: z.array(z.string()).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    createdByUserId: z.uuid().optional(),
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
    countryId: z.number().int().nullable().optional(),
    stateId: z.number().int().nullable().optional(),
    cityId: z.number().int().nullable().optional(),
    country: z.string(),
    city: z.string(),
    district: z.string().nullable().optional(),
    line1: z.string(),
    line2: z.string().nullable().optional(),
    postalCode: z.string().nullable().optional(),
    taxOffice: z.string().nullable().optional(),
    taxNumber: z.string().nullable().optional(),
    isPrimary: z.boolean(),
    isBilling: z.boolean(),
    isShipping: z.boolean(),
    note: z.string().nullable().optional(),
    displayOrder: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    countryRef: z.object({
        id: z.number(),
        name: z.string(),
        iso2: z.string(),
    }).loose().nullable().optional(),
    stateRef: z.object({
        id: z.number(),
        name: z.string(),
    }).loose().nullable().optional(),
    cityRef: z.object({
        id: z.number(),
        name: z.string(),
    }).loose().nullable().optional(),
}).loose()

const customerSchema = z.object({
    id: z.uuid(),
    companyName: z.string().nullable().optional(),
    fullName: z.string(),
    phone: z.string(),
    email: z.string(),
    note: z.string().nullable().optional(),
    status: z.enum(["LEAD", "CUSTOMER"]),
    generalDiscountPercent: z.number().min(0).max(100).nullable().optional(),
    defaultPaymentTermDays: z.number().int().min(0).nullable().optional(),
    creditLimit: z.number().min(0).nullable().optional(),
    paymentTermNote: z.string().nullable().optional(),
    assignedSalesUserId: z.uuid().nullable().optional(),
    convertedAt: z.string().nullable().optional(),
    convertedByUserId: z.uuid().nullable().optional(),
    sectorValueId: z.uuid().nullable().optional(),
    productionGroupValueId: z.uuid().nullable().optional(),
    attributeValueAssignments: z.array(customerAttributeAssignmentSchema).optional(),
    companyContactAssignments: z.array(customerCompanyContactAssignmentSchema).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    sectorValue: customerValueSchema.nullable().optional(),
    productionGroupValue: customerValueSchema.nullable().optional(),
    usageAreaValues: z.array(customerValueSchema).optional(),
    assignedSalesUser: userSummarySchema.nullable().optional(),
    convertedByUser: userSummarySchema.nullable().optional(),
    portalUsers: z.array(userSummarySchema).optional(),
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
            generalDiscountPercent: z.number().min(0).max(100).nullable().optional(),
            defaultPaymentTermDays: z.number().int().min(0).nullable().optional(),
            creditLimit: z.number().min(0).nullable().optional(),
            paymentTermNote: z.string().trim().max(5000).nullable().optional(),
            assignedSalesUserId: z.uuid().nullable().optional(),
            attributeValueIds: z.array(z.uuid()).max(100).optional(),
            sectorValueId: z.uuid().nullable().optional(),
            productionGroupValueId: z.uuid().nullable().optional(),
            usageAreaValueIds: z.array(z.uuid()).max(30).optional(),
            companyContactAssignments: z.array(z.object({
                companyContactId: z.uuid(),
                isActive: z.boolean().optional(),
                displayOrder: z.number().int().min(0).optional(),
                note: z.string().trim().max(2000).nullable().optional(),
            })).max(50).optional(),
            addresses: z.array(z.object({
                label: z.string().trim().min(2).max(120),
                contactName: z.string().trim().max(120).nullable().optional(),
                phone: z.string().trim().max(50).nullable().optional(),
                email: z.email().nullable().optional(),
                countryId: z.number().int().positive().nullable().optional(),
                stateId: z.number().int().positive().nullable().optional(),
                cityId: z.number().int().positive().nullable().optional(),
                country: z.string().trim().min(2).max(80).nullable().optional(),
                city: z.string().trim().min(2).max(120),
                district: z.string().trim().max(120).nullable().optional(),
                line1: z.string().trim().min(5).max(255),
                line2: z.string().trim().max(255).nullable().optional(),
                postalCode: z.string().trim().max(20).nullable().optional(),
                taxOffice: z.string().trim().max(120).nullable().optional(),
                taxNumber: z.string().trim().max(32).nullable().optional(),
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
