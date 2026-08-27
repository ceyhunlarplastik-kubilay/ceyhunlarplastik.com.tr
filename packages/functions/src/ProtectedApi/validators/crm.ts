import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional()
const nullablePositiveInt = () => z.number().int().positive().nullable().optional()
const nullableCoord = (min: number, max: number) => z.number().min(min).max(max).nullable().optional()
const nullableInviteText = (max: number) => z.string().trim().max(max).nullable().optional()

const customerAddressLocationSchema = z.object({
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
    locationVerifiedAt: z.string().trim().max(80).nullable().optional(),
    locationVerifiedByUserId: z.uuid().nullable().optional(),
    isPrimary: z.boolean().optional(),
    isBilling: z.boolean().optional(),
    isShipping: z.boolean().optional(),
    note: nullableText(1000),
}).superRefine((body, ctx) => {
    if (body.latitude == null) {
        ctx.addIssue({
            code: "custom",
            path: ["latitude"],
            message: "Konum koordinatı gerekli.",
        })
    }

    if (body.longitude == null) {
        ctx.addIssue({
            code: "custom",
            path: ["longitude"],
            message: "Konum koordinatı gerekli.",
        })
    }
}).loose()

const customerMapPointSchema = z.object({
    customerId: z.uuid(),
    companyName: z.string().nullable().optional(),
    fullName: z.string(),
    email: z.string(),
    phone: z.string(),
    status: z.enum(["LEAD", "CUSTOMER"]),
    assignedSalesUserId: z.uuid().nullable().optional(),
    addressId: z.uuid(),
    addressLabel: z.string(),
    addressSummary: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    isPrimary: z.boolean(),
    isShipping: z.boolean(),
}).loose()

const portalCustomerUserInviteSchema = z.object({
    firstName: z.string().trim().min(2).max(120),
    lastName: z.string().trim().min(2).max(120),
    email: z.email(),
    customerContactTitle: nullableInviteText(120),
    customerContactDepartment: nullableInviteText(120),
    isPrimaryCustomerContact: z.boolean().optional(),
}).loose()

export const createPortalCustomerUserValidator = validatorWrapper(
    z.object({
        body: portalCustomerUserInviteSchema,
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["firstName", "lastName", "email"],
    },
)

export const createPortalCustomerAddressValidator = validatorWrapper(
    z.object({
        body: customerAddressLocationSchema,
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["label", "city", "line1", "latitude", "longitude"],
    },
)

export const updatePortalCustomerAddressValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            addressId: z.uuid(),
        }),
        body: customerAddressLocationSchema,
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["label", "city", "line1", "latitude", "longitude"],
    },
)

export const deletePortalCustomerAddressValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            addressId: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

/**
 * Müşterinin kendi favori varyantı (kalp butonu). Gövde yalnız varyant kimliği
 * taşır: müşteri kaynağı, sahiplik ve sıra sunucuda belirlenir — istemci
 * `source` ya da `displayOrder` gönderemez.
 */
export const createPortalCustomerFavoriteVariantValidator = validatorWrapper(
    z.object({
        body: z.object({
            productVariantId: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["productVariantId"],
    },
)

export const deletePortalCustomerFavoriteVariantValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            productVariantId: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

export const createManagedCustomerAddressValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: customerAddressLocationSchema,
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["label", "city", "line1", "latitude", "longitude"],
    },
)

export const updateManagedCustomerAddressValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
            addressId: z.uuid(),
        }),
        body: customerAddressLocationSchema,
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["label", "city", "line1", "latitude", "longitude"],
    },
)

export const deleteManagedCustomerAddressValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
            addressId: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    },
)

export const listManagedCustomersMapValidator = validatorWrapper(
    z.object({
        queryStringParameters: z.object({
            north: z.coerce.number().min(-90).max(90),
            south: z.coerce.number().min(-90).max(90),
            east: z.coerce.number().min(-180).max(180),
            west: z.coerce.number().min(-180).max(180),
            search: z.string().trim().optional(),
            status: z.enum(["LEAD", "CUSTOMER"]).optional(),
            assignedSalesUserId: z.uuid().optional(),
        }),
    }).loose(),
    {
        requiredRootFields: ["queryStringParameters"],
        requiredQueryStringParametersFields: ["north", "south", "east", "west"],
    },
)

export const customerMapPointsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(customerMapPointSchema),
            }),
        }),
    }).loose(),
)

/* -------------------------------------------------------------------------- */
/* Ürün → müşteri eşleşmesi                                                    */
/* -------------------------------------------------------------------------- */

const productProfileReachLabelSchema = z.object({
    id: z.uuid(),
    name: z.string(),
}).loose()

const productMatchedCustomerSchema = z.object({
    id: z.uuid(),
    companyName: z.string().nullable(),
    fullName: z.string().nullable(),
    email: z.string(),
    phone: z.string(),
    status: z.enum(["LEAD", "CUSTOMER"]),
    createdAt: z.string(),
    sectorName: z.string().nullable(),
    productionGroupName: z.string().nullable(),
    assignedSalesUserName: z.string().nullable(),
    locationSummary: z.string().nullable(),
    address: z.object({
        id: z.uuid(),
        label: z.string(),
        summary: z.string(),
        latitude: z.number().nullable(),
        longitude: z.number().nullable(),
        isPrimary: z.boolean(),
        isShipping: z.boolean(),
    }).loose().nullable(),
    matchedLabels: z.array(z.string()),
}).loose()

export const listProductMatchedCustomersValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        queryStringParameters: z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            search: z.string().trim().max(200).optional(),
            sort: z.enum(["companyName", "fullName", "createdAt", "status"]).optional(),
            order: z.enum(["asc", "desc"]).optional(),
            status: z.enum(["LEAD", "CUSTOMER"]).optional(),
            assignedSalesUserId: z.uuid().optional(),
            // Adres filtresi — normalize FK'lar; query string olduğu için coerce.
            countryId: z.coerce.number().int().positive().optional(),
            stateId: z.coerce.number().int().positive().optional(),
            cityId: z.coerce.number().int().positive().optional(),
        }).optional(),
    }).loose(),
    {
        requiredRootFields: ["pathParameters"],
        requiredPathParametersFields: ["id"],
    },
)

export const productMatchedCustomersResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(productMatchedCustomerSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                }).loose(),
                counts: z.object({
                    all: z.number(),
                    lead: z.number(),
                    customer: z.number(),
                }).loose(),
                reach: z.object({
                    sectors: z.array(productProfileReachLabelSchema),
                    productionGroups: z.array(productProfileReachLabelSchema),
                    usageAreas: z.array(productProfileReachLabelSchema),
                }).loose(),
            }).loose(),
        }).loose(),
    }).loose(),
)
