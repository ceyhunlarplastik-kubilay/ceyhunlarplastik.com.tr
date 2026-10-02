import { describe, expect, it } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import { saveVariantMatrixValidator } from "@/functions/AdminApi/validators/productVariantMatrix"
import { createProductVariantValidator } from "@/functions/AdminApi/validators/productVariants"
import {
    createMeasurementTypeValidator,
    updateMeasurementTypeValidator,
} from "@/functions/AdminApi/validators/measurementTypes"
import { parseMeasurementInput } from "@/core/helpers/productVariants/measurementValue"

/**
 * Ölçü girişinin istek sözleşmesi — bileşik değer biçimleri ve ölçü tipi kodları.
 *
 * Bileşik `rawValue` deseni ve kod listesi core'da tek kaynaktan gelir
 * (`measurementValue.ts`, `measurementCodes.ts`); bu test o kaynağın JSON Schema'ya
 * çevrilip ajv'de (Middy'nin istek ayarlarıyla) gerçekten aynı kuralı uyguladığını sınar.
 *
 * Bu dosya `validators/` altında DURAMAZ (`validatorCompilation.test.ts` orayı eager yükler).
 */
const PRODUCT_ID = "3f2b8c1e-5a4d-4e6f-9a1b-2c3d4e5f6a7b"
const REQUIREMENT_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7"
const MEASUREMENT_TYPE_ID = "9b2f4c6d-1e3a-4b5c-8d7e-6f5a4b3c2d1e"

// Middy'nin istek tarafında kullandığı ajv ayarları (bkz. core/middy.ts).
const compile = (schema: object) =>
    transpileSchema(schema, {
        allErrors: true,
        strict: true,
        coerceTypes: "array",
        useDefaults: "empty",
    }) as unknown as ValidateFunction

const matrixBody = (measurement: Record<string, unknown>) => ({
    pathParameters: { id: PRODUCT_ID },
    body: { rows: [{ name: "Kol 10-30", measurements: [{ requirementId: REQUIREMENT_ID, ...measurement }] }] },
})

describe("bileşik ölçü — matris kaydı (PUT /products/{id}/variant-matrix)", () => {
    const validate = compile(saveVariantMatrixValidator)

    it("10*30, 10/30 ve 10-30 kabul edilir", () => {
        for (const rawValue of ["10*30", "10/30", "10-30", "5.5/105"]) {
            expect(validate(matrixBody({ value: 10, rawValue })), rawValue).toBe(true)
        }
    })

    it("arayüzün ürettiği her bileşik değer sunucuda da geçer (aynı tek kaynak)", () => {
        for (const input of ["10 x 30", "10×30", "10 / 30", "10 - 30", "5,5-10,25"]) {
            const parsed = parseMeasurementInput(input, "W_L")
            expect(validate(matrixBody({ value: parsed?.value, rawValue: parsed?.rawValue })), input).toBe(true)
        }
    })

    it("kanonik olmayan ya da serbest metin reddedilir", () => {
        for (const rawValue of ["10x30", "10 / 30", "10,5*30", "abc", "10/30/40", "10--30"]) {
            expect(validate(matrixBody({ value: 10, rawValue })), rawValue).toBe(false)
        }
    })

    it("düz sayısal ölçü rawValue olmadan geçer", () => {
        expect(validate(matrixBody({ value: 12.5 }))).toBe(true)
    })
})

describe("bileşik ölçü — tekil varyant (POST /product-variants)", () => {
    const validate = compile(createProductVariantValidator)
    const body = (rawValue: string) => ({
        body: {
            productId: PRODUCT_ID,
            name: "Kol",
            measurements: [{ requirementId: REQUIREMENT_ID, value: 10, rawValue }],
        },
    })

    it("10/30 ve 10-30 kabul, kanonik olmayan reddedilir", () => {
        expect(validate(body("10/30"))).toBe(true)
        expect(validate(body("10-30"))).toBe(true)
        expect(validate(body("10 - 30"))).toBe(false)
    })
})

describe("ölçü tipi kodları — P_T ve W_L", () => {
    const create = compile(createMeasurementTypeValidator)
    const update = compile(updateMeasurementTypeValidator)
    const createBody = (code: string) => ({ body: { code, name: "Profil-Kalınlık", baseUnit: "mm" } })

    it("yeni kodlarla ölçü tipi oluşturulabilir ve güncellenebilir", () => {
        expect(create(createBody("P_T"))).toBe(true)
        expect(create(createBody("W_L"))).toBe(true)
        expect(update({ pathParameters: { id: MEASUREMENT_TYPE_ID }, body: { code: "W_L" } })).toBe(true)
    })

    it("kodun ekrandaki tireli hâli API değeri değildir", () => {
        expect(create(createBody("P-T"))).toBe(false)
        expect(create(createBody("XX"))).toBe(false)
    })
})
