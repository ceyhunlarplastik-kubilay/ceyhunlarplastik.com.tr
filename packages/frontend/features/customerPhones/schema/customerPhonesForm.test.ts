import { describe, expect, it } from "vitest"
import { z } from "zod"

import {
    addDuplicatePhoneIssues,
    additionalPhonesFormSchema,
    toAdditionalPhoneFormValues,
    toAdditionalPhonesPayload,
} from "./customerPhonesForm"

// Gerçek formlardaki bağlama biçimiyle aynı: birincil `phone` + ek satırlar,
// tekrar kontrolü kök şemada.
const schema = z.object({
    phone: z.string().trim(),
    additionalPhones: additionalPhonesFormSchema,
}).superRefine((values, ctx) => addDuplicatePhoneIssues(values, ctx))

function issues(input: unknown) {
    const result = schema.safeParse(input)
    return result.success ? [] : result.error.issues.map((issue) => ({ path: issue.path, message: issue.message }))
}

describe("ek telefon form şeması", () => {
    it("numarası boş satırı kabul eder ve payload'a koymaz", () => {
        const result = schema.safeParse({
            phone: "0532 000 00 00",
            additionalPhones: [
                { number: "", label: "" },
                { number: " 0232 111 22 33 ", label: " Muhasebe " },
                { number: "0212 777 88 99", label: "" },
            ],
        })

        expect(result.success).toBe(true)
        if (!result.success) return

        expect(toAdditionalPhonesPayload(result.data.additionalPhones)).toEqual([
            { number: "0232 111 22 33", label: "Muhasebe" },
            { number: "0212 777 88 99", label: null },
        ])
    })

    it("etiketli ama numarasız satırda numara ister", () => {
        expect(issues({ phone: "0532 000 00 00", additionalPhones: [{ number: "", label: "Muhasebe" }] })).toEqual([
            { path: ["additionalPhones", 0, "number"], message: "Etiketli satıra numara girin" },
        ])
    })

    it("kısa numarayı reddeder", () => {
        expect(issues({ phone: "0532 000 00 00", additionalPhones: [{ number: "123", label: "" }] })).toEqual([
            { path: ["additionalPhones", 0, "number"], message: "Telefon çok kısa" },
        ])
    })

    it("birincil numarayla aynı hattı farklı yazımda da yakalar", () => {
        expect(issues({
            phone: "0532 000 00 00",
            additionalPhones: [{ number: "+90 532 000 00 00", label: "Cep" }],
        })).toEqual([
            { path: ["additionalPhones", 0, "number"], message: "Bu numara zaten ekli" },
        ])
    })

    it("tekrar eden satırlardan yalnız sonrakini işaretler", () => {
        expect(issues({
            phone: "0532 000 00 00",
            additionalPhones: [
                { number: "0232 111 22 33", label: "Muhasebe" },
                { number: "02321112233", label: "Satın Alma" },
            ],
        })).toEqual([
            { path: ["additionalPhones", 1, "number"], message: "Bu numara zaten ekli" },
        ])
    })

    it("API'den gelen etiketsiz numarayı boş etiketli form satırına çevirir", () => {
        expect(toAdditionalPhoneFormValues([
            { number: "0232 111 22 33", label: "Muhasebe" },
            { number: "0212 777 88 99", label: null },
        ])).toEqual([
            { number: "0232 111 22 33", label: "Muhasebe" },
            { number: "0212 777 88 99", label: "" },
        ])
        expect(toAdditionalPhoneFormValues(undefined)).toEqual([])
    })
})
