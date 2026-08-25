import { describe, expect, it } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import { productVariantTableResponseValidator } from "@/functions/PublicApi/validators/products"
import { customerProductVariantTableResponseValidator } from "@/functions/ProtectedApi/validators/products"
import { buildVariantTableMeta } from "@/core/helpers/products/buildVariantTableMeta"

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

describe("varyant tablosu meta şeması", () => {
    it("public uç helper'ın çıktısını kabul eder", () => {
        const validate = transpileSchema(productVariantTableResponseValidator) as unknown as ValidateFunction
        const valid = validate({
            statusCode: 200,
            body: { statusCode: 200, payload: { data: [], meta } },
        })
        expect(validate.errors ?? []).toEqual([])
        expect(valid).toBe(true)
    })

    it("portal ucu helper'ın çıktısını kabul eder", () => {
        const validate = transpileSchema(customerProductVariantTableResponseValidator) as unknown as ValidateFunction
        const valid = validate({
            statusCode: 200,
            body: { statusCode: 200, payload: { data: [], meta, customerDiscountPercent: null } },
        })
        expect(validate.errors ?? []).toEqual([])
        expect(valid).toBe(true)
    })
})
