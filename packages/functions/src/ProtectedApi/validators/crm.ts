import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const customerPortalAddressSchema = z.object({
    label: z.string().trim().min(2).max(120),
    contactName: z.string().trim().max(120).nullable().optional(),
    phone: z.string().trim().max(50).nullable().optional(),
    email: z.email().nullable().optional(),
    countryId: z.number().int().positive(),
    stateId: z.number().int().positive(),
    cityId: z.number().int().positive(),
    country: z.string().trim().min(2).max(80).nullable().optional(),
    stateName: z.string().trim().max(120).nullable().optional(),
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
}).loose()

export const createPortalCustomerAddressValidator = validatorWrapper(
    z.object({
        body: customerPortalAddressSchema,
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["label", "countryId", "stateId", "cityId", "city", "line1"],
    },
)
