import { describe, expect, it } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import {
    createLeadCustomerValidator,
    leadCustomerDetailResponseValidator,
    listLeadCustomersResponseValidator,
    updateLeadCustomerValidator,
} from "@/functions/AdminApi/validators/leadCustomers"
import type {
    LeadCustomerDetail,
    LeadCustomerSummary,
    listLeadCustomers,
} from "@/core/helpers/crm/leadCustomers"

/**
 * Potansiyel müşteri yanıt şeması KATI (`.loose()` yok): helper'a eklenip şemaya
 * eklenmeyen her alan uçları "Response object failed validation" ile 500'e
 * düşürür — hem `/lead-customers` (veri girişi) hem `/sales/lead-customers`
 * (temsilci) AYNI şemayı kullanır. Fixture'lar helper'ın dönüş TİPİYLE yazıldı:
 * helper'a alan eklenirse burası ya derlenmez ya da düşer.
 *
 * DİKKAT: bu dosya `validators/` altında DURAMAZ — `validatorCompilation.test.ts`
 * orayı `import.meta.glob(..., { eager: true })` ile tarıyor.
 */

const summary: LeadCustomerSummary = {
    id: "0f6f7c44-8a0e-4d59-9d0b-6a0a3d1f2b10",
    companyName: "Acme Plastik",
    websiteUrl: "https://acme.test",
    fullName: null,
    phone: "0232 000 00 00",
    additionalPhones: [
        { id: "2a4e1c0e-5a0b-4f0a-9f7e-6e1f1d2c3b4a", number: "0232 111 22 33", label: "Muhasebe", displayOrder: 0 },
        { id: "7c9d2e1f-3b4a-4c5d-8e6f-0a1b2c3d4e5f", number: "0532 444 55 66", label: null, displayOrder: 1 },
    ],
    email: "",
    note: null,
    sectorValue: null,
    productionGroupValue: null,
    usageAreaValues: [],
    createdAt: new Date("2026-09-23T00:00:00.000Z"),
    updatedAt: new Date("2026-09-23T00:00:00.000Z"),
}

function validateResponse(validator: object, payload: unknown) {
    const validate = transpileSchema(validator) as unknown as ValidateFunction
    // `apiResponseDTO` Date'leri ISO string'e çevirir; şema onu bekliyor.
    const body = { statusCode: 200, payload: JSON.parse(JSON.stringify(payload)) }
    const valid = validate({ statusCode: 200, body })

    return { valid, errors: validate.errors ?? [] }
}

describe("potansiyel müşteri yanıt şemaları", () => {
    it("listLeadCustomers'ın gerçek çıktısını kabul eder", () => {
        const result: Awaited<ReturnType<typeof listLeadCustomers>> = {
            data: [summary],
            meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }

        const { valid, errors } = validateResponse(listLeadCustomersResponseValidator, result)
        expect(errors).toEqual([])
        expect(valid).toBe(true)
    })

    it("getLeadCustomer'ın gerçek çıktısını kabul eder", () => {
        const customer: LeadCustomerDetail = {
            ...summary,
            matchedProductCount: 0,
            matchedProducts: [],
            addresses: [],
        }

        const { valid, errors } = validateResponse(leadCustomerDetailResponseValidator, { customer })
        expect(errors).toEqual([])
        expect(valid).toBe(true)
    })
})

describe("potansiyel müşteri istek şemaları — ek telefonlar", () => {
    // middy'nin lambdaHandler'da istek için geçtiği ajv ayarları.
    const compile = (validator: object) => transpileSchema(validator, {
        allErrors: true,
        strict: true,
        coerceTypes: "array",
        useDefaults: "empty",
    }) as unknown as (event: unknown) => boolean

    const validateCreate = compile(createLeadCustomerValidator as object)
    const validateUpdate = compile(updateLeadCustomerValidator as object)

    const body = (additionalPhones?: unknown) => ({
        companyName: "Acme Plastik",
        phone: "0232 000 00 00",
        ...(additionalPhones === undefined ? {} : { additionalPhones }),
    })

    it("oluşturma ve güncellemede ek telefonları kabul eder, göndermemek de geçerlidir", () => {
        const phones = [{ number: "0232 111 22 33", label: "Muhasebe" }, { number: "0532 444 55 66" }]

        expect(validateCreate({ body: body(phones) })).toBe(true)
        expect(validateCreate({ body: body() })).toBe(true)
        expect(validateUpdate({ pathParameters: { id: summary.id }, body: body(phones) })).toBe(true)
        expect(validateUpdate({ pathParameters: { id: summary.id }, body: body() })).toBe(true)
    })

    it("tanımsız alanı reddeder (iç objeler katı)", () => {
        expect(validateCreate({ body: body([{ number: "0232 111 22 33", isWhatsapp: true }]) })).toBe(false)
    })
})
