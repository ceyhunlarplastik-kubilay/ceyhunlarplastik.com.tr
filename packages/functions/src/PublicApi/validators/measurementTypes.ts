import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const localeSchema = z.enum(["tr", "en"])
const measurementTypeSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    locale: localeSchema.optional(),
    resolvedLocale: z.string().optional(),
    translationMissing: z.boolean().optional(),
    baseUnit: z.string(),
    displayOrder: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

export const idValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        queryStringParameters: z.object({
            locale: localeSchema.optional(),
        }).optional(),
    }),
    {
        requiredRootFields: ["pathParameters"],
    }
)

// Response Validators
export const measurementTypeResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                measurementType: measurementTypeSchema
            })
        })
    }).loose()
)

export const listMeasurementTypeResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(measurementTypeSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                })
            })
        })
    }).loose()
)
