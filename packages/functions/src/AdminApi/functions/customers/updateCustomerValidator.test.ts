import { describe, expect, it } from "vitest"
import { transpileSchema } from "@middy/validator/transpile"
import type { ValidateFunction } from "ajv"

import { customerResponseValidator, updateCustomerValidator } from "@/functions/AdminApi/validators/customers"

/**
 * `PUT /customers/{id}` (admin) ve `PUT /sales/customers/{id}` (temsilci) AYNI
 * istek ve yanıt validator'larını kullanır.
 *
 * Veri girişi potansiyel müşteriyi yetkili adı ve e-posta olmadan kaydedebildiği
 * için (fullName null, email "") bu uç o kayıtları da güncelleyebilmeli — eskiden
 * `email: z.email()` boş değeri reddediyordu.
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

    describe("ek telefonlar", () => {
        it("numara + opsiyonel etiket listesini ve boş listeyi kabul eder", () => {
            expect(validate(event({
                additionalPhones: [
                    { number: "0232 111 22 33", label: "Muhasebe" },
                    { number: "0532 444 55 66", label: null },
                    { number: "0212 777 88 99" },
                ],
            }))).toBe(true)
            // Boş liste = tüm ek numaraları sil.
            expect(validate(event({ additionalPhones: [] }))).toBe(true)
        })

        it("kısa numarayı, uzun etiketi ve tanımsız alanı reddeder", () => {
            expect(validate(event({ additionalPhones: [{ number: "123" }] }))).toBe(false)
            expect(validate(event({ additionalPhones: [{ number: "0232 111 22 33", label: "x".repeat(61) }] }))).toBe(false)
            expect(validate(event({ additionalPhones: [{ number: "0232 111 22 33", isWhatsapp: true }] }))).toBe(false)
        })

        it("10'dan fazla ek numarayı reddeder", () => {
            const phones = (count: number) => Array.from({ length: count }, (_, index) => ({
                number: `0232 111 22 ${String(index).padStart(2, "0")}`,
            }))

            expect(validate(event({ additionalPhones: phones(10) }))).toBe(true)
            expect(validate(event({ additionalPhones: phones(11) }))).toBe(false)
        })
    })
})

describe("customerResponseValidator — ek telefonlar", () => {
    it("repository'nin döndürdüğü ek telefon şeklini kabul eder", () => {
        // Alanlar `customerPhoneSelect` ile aynı; etiket null olabilir.
        const customer = {
            id: "0f6f7c44-8a0e-4d59-9d0b-6a0a3d1f2b10",
            companyName: "Acme Plastik",
            fullName: "Ali Veli",
            phone: "0232 000 00 00",
            additionalPhones: [
                { id: "2a4e1c0e-5a0b-4f0a-9f7e-6e1f1d2c3b4a", number: "0232 111 22 33", label: "Muhasebe", displayOrder: 0 },
                { id: "7c9d2e1f-3b4a-4c5d-8e6f-0a1b2c3d4e5f", number: "0532 444 55 66", label: null, displayOrder: 1 },
            ],
            email: "",
            status: "LEAD",
            createdAt: "2026-09-23T00:00:00.000Z",
            updatedAt: "2026-09-23T00:00:00.000Z",
        }

        const validate = transpileSchema(customerResponseValidator) as unknown as ValidateFunction
        const valid = validate({ statusCode: 200, body: { statusCode: 200, payload: { customer } } })

        expect(validate.errors ?? []).toEqual([])
        expect(valid).toBe(true)
    })
})
