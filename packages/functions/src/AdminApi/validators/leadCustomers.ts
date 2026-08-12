import { z } from "zod"

import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

/**
 * Bu yüzey BİLİNÇLİ olarak dardır: iskonto, kredi limiti, vade, satış temsilcisi
 * ve `status` alanları şemada HİÇ yoktur, dolayısıyla içerik editörü tarafından
 * gönderilemez (`additionalProperties: false` iç objelerde geçerlidir).
 */
const profileBodySchema = z.object({
    companyName: z.string().trim().max(255).nullable().optional(),
    fullName: z.string().trim().min(2).max(255),
    phone: z.string().trim().min(5).max(50),
    email: z.email().max(320),
    note: z.string().trim().max(5000).nullable().optional(),
    sectorValueId: z.uuid().nullable().optional(),
    productionGroupValueId: z.uuid().nullable().optional(),
    usageAreaValueIds: z.array(z.uuid()).max(200).optional(),
})

export const listLeadCustomersValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            search: z.string().optional(),
            sectorValueId: z.uuid().optional(),
            usageAreaValueId: z.uuid().optional(),
        }).optional(),
    }),
    {
        requiredRootFields: [],
    },
)

export const getLeadCustomerValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

export const createLeadCustomerValidator = validatorWrapper(
    z.object({
        body: profileBodySchema,
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["fullName", "phone", "email"],
    },
)

export const updateLeadCustomerValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: profileBodySchema,
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["fullName", "phone", "email"],
    },
)

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional()
const nullablePositiveInt = () => z.number().int().positive().nullable().optional()
const nullableCoord = (min: number, max: number) =>
    z.number().min(min).max(max).nullable().optional()

/**
 * ProtectedApi'deki satış adres şemasıyla aynı alanlar. Koordinat ZORUNLU:
 * form zaten haritadan konum seçtiriyor, uç da onu şart koşar.
 */
const leadCustomerAddressBodySchema = z.object({
    label: z.string().trim().min(2).max(120),
    contactName: nullableText(120),
    phone: nullableText(50),
    email: z.email().nullable().optional(),
    countryId: nullablePositiveInt(),
    stateId: nullablePositiveInt(),
    cityId: nullablePositiveInt(),
    country: z.string().trim().min(2).max(80).nullable().optional(),
    stateName: nullableText(120),
    city: z.string().trim().min(2).max(120),
    district: nullableText(120),
    line1: z.string().trim().min(5).max(255),
    line2: nullableText(255),
    postalCode: nullableText(20),
    taxOffice: nullableText(120),
    taxNumber: nullableText(32),
    latitude: nullableCoord(-90, 90),
    longitude: nullableCoord(-180, 180),
    locationSource: z.enum(["MANUAL_PIN", "GEOCODED", "IMPORTED", "CUSTOMER_SUBMITTED"]).nullable().optional(),
    locationAccuracy: z.enum(["EXACT", "STREET", "DISTRICT", "CITY", "UNKNOWN"]).nullable().optional(),
    geocodingProvider: nullableText(80),
    geocodingPlaceId: nullableText(255),
    geocodingLabel: nullableText(500),
    geocodingRaw: z.unknown().nullable().optional(),
    geocodedAt: z.string().trim().max(80).nullable().optional(),
    isPrimary: z.boolean().optional(),
    isBilling: z.boolean().optional(),
    isShipping: z.boolean().optional(),
    note: nullableText(1000),
}).superRefine((body, ctx) => {
    if (body.latitude == null) {
        ctx.addIssue({ code: "custom", path: ["latitude"], message: "Konum koordinatı gerekli." })
    }
    if (body.longitude == null) {
        ctx.addIssue({ code: "custom", path: ["longitude"], message: "Konum koordinatı gerekli." })
    }
}).loose()

export const createLeadCustomerAddressValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({ id: z.uuid() }),
        body: leadCustomerAddressBodySchema,
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    },
)

export const updateLeadCustomerAddressValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({ id: z.uuid(), addressId: z.uuid() }),
        body: leadCustomerAddressBodySchema,
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
    },
)

export const deleteLeadCustomerAddressValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({ id: z.uuid(), addressId: z.uuid() }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

const attributeValueSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    parentValueId: z.uuid().nullable(),
})

const leadCustomerSummarySchema = z.object({
    id: z.uuid(),
    companyName: z.string().nullable(),
    fullName: z.string(),
    phone: z.string(),
    email: z.string(),
    note: z.string().nullable(),
    sectorValue: attributeValueSchema.nullable(),
    productionGroupValue: attributeValueSchema.nullable(),
    usageAreaValues: z.array(attributeValueSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
})

const leadCustomerDetailSchema = leadCustomerSummarySchema.extend({
    addresses: z.array(z.object({
        id: z.uuid(),
        customerId: z.uuid(),
        label: z.string(),
        city: z.string(),
        line1: z.string(),
        isPrimary: z.boolean(),
        isBilling: z.boolean(),
        isShipping: z.boolean(),
    }).loose()),
    matchedProductCount: z.number(),
    matchedProducts: z.array(z.object({
        id: z.uuid(),
        code: z.string(),
        name: z.string(),
        slug: z.string(),
        categoryName: z.string().nullable(),
        primaryImageUrl: z.string().nullable(),
        matchedLabels: z.array(z.string()),
    })),
})

export const listLeadCustomersResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(leadCustomerSummarySchema),
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

export const leadCustomerDetailResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                customer: leadCustomerDetailSchema,
            }),
        }),
    }).loose(),
)
