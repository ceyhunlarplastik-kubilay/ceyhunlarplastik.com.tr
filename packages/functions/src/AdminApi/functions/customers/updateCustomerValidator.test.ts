import { describe, expect, it } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"

import { updateCustomerValidator } from "@/functions/AdminApi/validators/customers"

/**
 * `PUT /customers/{id}` (admin) ve `PUT /sales/customers/{id}` (temsilci) AYNI
 * validator'ı kullanır. Veri girişi potansiyel müşteriyi yetkili adı ve e-posta
 * olmadan kaydedebildiği için (fullName null, email "") bu uç o kayıtları da
 * güncelleyebilmeli — eskiden `email: z.email()` boş değeri reddediyordu.
 *
 * `validatorWrapper` YALNIZ JSON Schema üretir; bu yüzden kural middy'nin
 * kullandığı ajv ayarlarıyla derlenmiş şema üzerinden sınanır.
 *
 * DİKKAT: bu dosya `validators/` altında DURAMAZ — `validatorCompilation.test.ts`
 * orayı `import.meta.glob(..., { eager: true })` ile tarıyor.
 */
describe("updateCustomerValidator", () => {
    const validate = transpileSchema(updateCustomerValidator as object, {
        allErrors: true,
        strict: true,
        coerceTypes: "array",
        useDefaults: "empty",
    }) as unknown as (event: unknown) => boolean

    const event = (body: Record<string, unknown>) => ({
        pathParameters: { id: "0f6f7c44-8a0e-4d59-9d0b-6a0a3d1f2b10" },
        body,
    })

    it("boş e-postayı ve null yetkili adını kabul eder", () => {
        expect(validate(event({ email: "", fullName: null }))).toBe(true)
    })

    it("dolu e-postanın biçimini şema düzeyinde uygular", () => {
        expect(validate(event({ email: "info@acme.com" }))).toBe(true)
        expect(validate(event({ email: "gecersiz-adres" }))).toBe(false)
        expect(validate(event({ email: "bosluklu adres@acme.com" }))).toBe(false)
    })

    it("dolu yetkili adında en az 2 karakter ister", () => {
        expect(validate(event({ fullName: "A" }))).toBe(false)
        expect(validate(event({ fullName: "Ali" }))).toBe(true)
    })
})
