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
