import type { ValidateFunction } from "ajv"
import { transpileSchema } from "@middy/validator/transpile"
import { describe, expect, it } from "vitest"

import {
    portalCartLogisticsRequestValidator,
    portalCartLogisticsResponseValidator,
} from "@/functions/ProtectedApi/validators/products"

const UUID = "11111111-1111-4111-8111-111111111111"

const REQUEST_OPTIONS = {
    allErrors: true,
    strict: true,
    coerceTypes: "array",
    useDefaults: "empty",
} as const

describe("portal sepet lojistiği validator'ları", () => {
    it("UUID dizisini kabul eder; tekrarları handler tekilleştirir", () => {
        const validate = transpileSchema(
            portalCartLogisticsRequestValidator,
            REQUEST_OPTIONS,
        ) as unknown as ValidateFunction

        expect(validate({ body: { variantIds: [UUID, UUID] } })).toBe(true)
        expect(validate.errors ?? []).toEqual([])
    })

    it("geçersiz UUID, boş dizi ve 500 üzeri girdiyi reddeder", () => {
        const validate = transpileSchema(
            portalCartLogisticsRequestValidator,
            REQUEST_OPTIONS,
        ) as unknown as ValidateFunction

        expect(validate({ body: { variantIds: ["not-a-uuid"] } })).toBe(false)
        expect(validate({ body: { variantIds: [] } })).toBe(false)
        expect(validate({ body: { variantIds: Array.from({ length: 501 }, () => UUID) } })).toBe(false)
    })

    it("güvenli yanıtı kabul eder ve tedarikçi/ticari alan sızıntısını reddeder", () => {
        const validate = transpileSchema(
            portalCartLogisticsResponseValidator,
        ) as unknown as ValidateFunction
        const response = {
            statusCode: 200,
            body: {
                statusCode: 200,
                payload: {
                    profiles: [{
                        productVariantId: UUID,
                        status: "READY",
                        logistics: {
                            unitsPerPackage: 10,
                            packageVolumeM3: 0.25,
                            packageWeightKg: null,
                        },
                    }],
                },
            },
        }

        expect(validate(response)).toBe(true)
        ;(response.body.payload.profiles[0] as Record<string, unknown>).supplierId = "secret"
        expect(validate(response)).toBe(false)
    })
})
