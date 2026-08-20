import { describe, expect, it } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"

import { createLeadCustomerValidator } from "./leadCustomers"

/**
 * `validatorWrapper` YALNIZ JSON Schema üretir; Zod runtime'ı istek yolunda hiç
 * çalışmaz. `.refine()` JSON Schema'ya çevrilemediği için e-posta biçimi şemanın
 * kendisinde (union + `format`) durmalı — aksi halde sunucu her string'i
 * e-posta olarak kabul eder ve doğrulama yalnız tarayıcıda kalır.
 */
describe("lead customer e-posta doğrulaması", () => {
    // middy'nin lambdaHandler'da geçtiği ajv ayarlarıyla derlenir; tip bildirimi
    // Ajv örneği döndürüyormuş gibi görünse de sonuç bir validate fonksiyonudur.
    const validate = transpileSchema(createLeadCustomerValidator as object, {
        allErrors: true,
        strict: true,
        coerceTypes: "array",
        useDefaults: "empty",
    }) as unknown as (event: unknown) => boolean

    const event = (email?: unknown) => ({
        body: {
            companyName: "Acme Plastik",
            phone: "+90 555 000 00 00",
            ...(email === undefined ? {} : { email }),
        },
    })

    it("e-posta alanını zorunlu tutmaz", () => {
        expect(validate(event())).toBe(true)
        expect(validate(event(null))).toBe(true)
        expect(validate(event(""))).toBe(true)
    })

    it("dolu e-postanın biçimini şema düzeyinde uygular", () => {
        expect(validate(event("info@acme.com"))).toBe(true)
        expect(validate(event("gecersiz-adres"))).toBe(false)
        expect(validate(event("bosluklu adres@acme.com"))).toBe(false)
    })
})
