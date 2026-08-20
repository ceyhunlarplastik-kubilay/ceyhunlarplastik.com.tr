import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const measurementTypeSchema = z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    baseUnit: z.string(),
    displayOrder: z.number(),
}).loose()

const requirementTranslationSchema = z.object({
    id: z.string(),
    requirementId: z.string(),
    locale: z.string(),
    label: z.string(),
}).loose()

export const measurementRequirementSchema = z.object({
    id: z.string(),
    productId: z.string(),
    measurementTypeId: z.string(),
    label: z.string(),
    unit: z.string().nullable(),
    isRequired: z.boolean(),
    sortPriority: z.number(),
    displayOrder: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    measurementType: measurementTypeSchema,
    translations: z.array(requirementTranslationSchema),
}).loose()

/**
 * Şablon TAM olarak değiştirilir: gönderilmeyen satır silinir.
 *
 * `sortPriority` ölçü KODUNUN sırasını belirler — bu yüzden istemci sırayı açıkça
 * bildirir, sunucu dizideki konumdan varsayılan üretir.
 */
export const replaceMeasurementRequirementsValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            requirements: z.array(z.object({
                id: z.uuid().optional(),
                measurementTypeId: z.uuid(),
                label: z.string().min(1).max(120),
                unit: z.string().max(24).optional(),
                isRequired: z.boolean().optional(),
                sortPriority: z.number().int().min(0).max(999).optional(),
                displayOrder: z.number().int().min(0).max(999).optional(),
                translations: z.array(z.object({
                    locale: z.string().min(2).max(16),
                    label: z.string().min(1).max(120),
                })).optional(),
            })).max(24),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
        requiredBodyFields: ["requirements"],
    }
)

export const idValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

export const measurementRequirementsResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                requirements: z.array(measurementRequirementSchema),
            }),
        }),
    }).loose()
)
