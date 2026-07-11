import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

export const createProductMeasurementValidator = validatorWrapper(
    z.object({
        body: z.object({
            variantId: z.uuid(),
            measurementTypeId: z.uuid(),
            value: z.number(),
            label: z.string().optional(),
        }),
    }),
    {
        requiredRootFields: ["body"],
        requiredBodyFields: ["variantId", "measurementTypeId", "value"],
    }
)

export const updateProductMeasurementValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({
            id: z.uuid(),
        }),
        body: z.object({
            variantId: z.uuid().optional(),
            measurementTypeId: z.uuid().optional(),
            value: z.number().optional(),
            label: z.string().optional(),
        }),
    }),
    {
        requiredRootFields: ["pathParameters", "body"],
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

// Response Validators
// Repository'nin TÜM metotları `include: { measurementType: true }` kullanıyor,
// yani tekil ve liste yanıtları aynı shape'i taşır.
const measurementTypeSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    // MeasurementCode enum'u (18 değer) taksonomi gibi büyüyebilir;
    // yeni bir değer response validation'ı 500'e çevirmesin diye düz string.
    code: z.string(),
    baseUnit: z.string(),
    displayOrder: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
}).loose()

const productMeasurementSchema = z.object({
    id: z.uuid(),
    variantId: z.uuid(),
    measurementTypeId: z.uuid(),
    value: z.number(), // Float
    label: z.string(), // @default("")
    createdAt: z.string(),
    updatedAt: z.string(),
    measurementType: measurementTypeSchema,
}).loose()

// get / create / update / delete → payload: { productMeasurement }
export const productMeasurementResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                productMeasurement: productMeasurementSchema,
            }),
        }),
    }).loose()
)

// list → payload: { data, meta }
export const listProductMeasurementResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({
                data: z.array(productMeasurementSchema),
                meta: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    totalPages: z.number(),
                }),
            }),
        }),
    }).loose()
)
