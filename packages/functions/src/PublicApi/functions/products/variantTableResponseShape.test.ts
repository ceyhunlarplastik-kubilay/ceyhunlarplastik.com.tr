import { describe, expect, it } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import { productVariantTableResponseValidator } from "@/functions/PublicApi/validators/products"
import {
    customerProductVariantTableResponseValidator,
    customerProductVariantsByMeasurementResponseValidator,
} from "@/functions/ProtectedApi/validators/products"
import { productVariantsByMeasurementResponseValidator } from "@/functions/PublicApi/validators/products"
import { buildVariantTableMeta } from "@/core/helpers/products/buildVariantTableMeta"
import { groupVariantTableRows } from "@/core/helpers/products/groupVariantTableRows"

/**
 * `meta` bloğunu üreten helper ile iki response şemasını senkron tutar.
 *
 * Bu koruma olmadan helper'ın çıktısından bir alan düşmesi (ya da şemaya bir alan
 * eklenmesi) derlemede ve testlerde görünmez, yalnız çalışma zamanında
 * "Response object failed validation" olarak patlar — matris kayıt ucunda birebir
 * bu yaşandı (bkz. productVariantMatrix/responseShape.test.ts).
 *
 * Public ve portal uçları AYNI helper'ı kullanıyor; ikisi birden sınanır ki
 * yalnız birinin şeması güncellenip diğerinin unutulması yakalansın.
 *
 * DİKKAT: `validators/` altına KONULAMAZ — validatorCompilation.test.ts orayı
 * eager glob ile tarıyor ve suite o testin içine de kaydolur.
 */

const meta = buildVariantTableMeta({ page: 2, limit: 50, total: 120, columns: ["R", "H1"] })

// Gruplayıcının GERÇEK çıktısı — şema onunla senkron kalmalı.
const groupedRows = groupVariantTableRows([
    {
        id: "11111111-1111-1111-1111-111111111111",
        fullCode: "10.5.1.V1",
        measurements: [{ id: "m1", label: "Kol Çapı", value: 10, measurementType: { id: "mt1", code: "R" } }],
        color: { id: "c1" },
        materials: [{ id: "mat1" }],
    },
])

describe("varyant tablosu meta şeması", () => {
    it("public ölçü-detay ucu şemasıyla uyumlu", () => {
        const validate = transpileSchema(productVariantsByMeasurementResponseValidator) as unknown as ValidateFunction
        const valid = validate({
            statusCode: 200,
            body: { statusCode: 200, payload: { data: [], columns: ["R"] } },
        })
        expect(validate.errors ?? []).toEqual([])
        expect(valid).toBe(true)
    })

    it("portal ölçü-detay ucu şemasıyla uyumlu", () => {
        const validate = transpileSchema(customerProductVariantsByMeasurementResponseValidator) as unknown as ValidateFunction
        const valid = validate({
            statusCode: 200,
            body: { statusCode: 200, payload: { data: [], columns: ["R"], customerDiscountPercent: 5 } },
        })
        expect(validate.errors ?? []).toEqual([])
        expect(valid).toBe(true)
    })

    it("public uç helper'ın çıktısını kabul eder", () => {
        const validate = transpileSchema(productVariantTableResponseValidator) as unknown as ValidateFunction
        const valid = validate({
            statusCode: 200,
            body: { statusCode: 200, payload: { data: groupedRows, meta } },
        })
        expect(validate.errors ?? []).toEqual([])
        expect(valid).toBe(true)
    })

    it("portal ucu helper'ın çıktısını kabul eder", () => {
        const validate = transpileSchema(customerProductVariantTableResponseValidator) as unknown as ValidateFunction
        const valid = validate({
            statusCode: 200,
            body: { statusCode: 200, payload: { data: groupedRows, meta, customerDiscountPercent: null } },
        })
        expect(validate.errors ?? []).toEqual([])
        expect(valid).toBe(true)
    })
})
