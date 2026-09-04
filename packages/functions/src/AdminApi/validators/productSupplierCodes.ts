import { z } from "zod"
import { validatorWrapper } from "@/core/helpers/validation/validatorWrapper"

const supplierCodeSchema = z.object({
    id: z.string(),
    code: z.string(),
    supplierId: z.string(),
    supplier: z.object({ id: z.string(), name: z.string() }).loose(),
    usageCount: z.number(),
    // Ürün modeli + harf başına TEK teknik resim; yoksa null. Async yükleme
    // sırasında uploadStatus PENDING_UPLOAD gelir (arayüz "İşleniyor" gösterir).
    technicalDrawing: z.object({
        id: z.string(),
        key: z.string(),
        url: z.string(),
        mimeType: z.string(),
        uploadStatus: z.enum(["PENDING_UPLOAD", "ACTIVE"]),
        uploadedAt: z.string().nullable(),
        createdAt: z.string(),
    }).loose().nullable(),
    createdAt: z.string(),
}).loose()

export const listProductSupplierCodesValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({ id: z.uuid() }),
    }),
    { requiredRootFields: ["pathParameters"] },
)

export const createProductSupplierCodeValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({ id: z.uuid() }),
        body: z.object({
            supplierId: z.uuid(),
            // Harf: A..Z, AA.. Büyük harfe normalize etmeyi handler yapar.
            code: z.string().regex(/^[A-Za-z]{1,3}$/).optional(),
        }),
    }),
    { requiredRootFields: ["pathParameters", "body"] },
)

/** Harf (`code`) şemada HİÇ BEYAN EDİLMEZ: değiştirmek tüm kodları yeniden yazar. */
export const updateProductSupplierCodeValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({ id: z.uuid(), codeId: z.uuid() }),
        body: z.object({ supplierId: z.uuid() }),
    }),
    { requiredRootFields: ["pathParameters", "body"] },
)

export const deleteProductSupplierCodeValidator = validatorWrapper(
    z.object({
        pathParameters: z.object({ id: z.uuid(), codeId: z.uuid() }),
    }),
    { requiredRootFields: ["pathParameters"] },
)

export const listProductSupplierCodesResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({ codes: z.array(supplierCodeSchema) }).loose(),
        }).loose(),
    }).loose()
)

export const productSupplierCodeResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({ code: supplierCodeSchema }).loose(),
        }).loose(),
    }).loose()
)

export const deleteProductSupplierCodeResponseValidator = z.toJSONSchema(
    z.object({
        statusCode: z.number(),
        body: z.object({
            statusCode: z.number(),
            payload: z.object({ deletedId: z.string() }).loose(),
        }).loose(),
    }).loose()
)
