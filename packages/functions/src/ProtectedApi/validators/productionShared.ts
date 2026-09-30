import { z } from "zod"

/**
 * Üretim planlama validator'larının ortak parçaları. Bu modül `$schema` taşıyan bir
 * nesne dışa aktarmaz; `validatorCompilation.test.ts` onu atlar, derleme kapsamı
 * kullanıldığı validator dosyalarından gelir.
 */

export const productionIdParamsSchema = z.object({ id: z.uuid() })

export const shiftPatternRefSchema = z.object({ id: z.uuid(), name: z.string() }).loose()

export const productionAreaRefSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
}).loose()

export const productionMachineRefSchema = z.object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
}).loose()

/** apiResponseDTO zarfı: `{ statusCode, body: { statusCode, payload } }`. */
export function productionResponse<TShape extends z.ZodRawShape>(payload: TShape) {
    return z.toJSONSchema(
        z.object({
            statusCode: z.number(),
            body: z.object({
                statusCode: z.number(),
                payload: z.object(payload),
            }),
        }).loose(),
    )
}
