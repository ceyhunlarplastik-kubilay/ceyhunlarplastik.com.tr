import { describe, expect, it } from "vitest"

import {
    buildLeadCustomerPayload,
    createLeadCustomerFormDefaults,
    leadCustomerFormSchema,
} from "./leadCustomerForm"

describe("leadCustomerFormSchema", () => {
    it("accepts a blank optional email and normalizes it to null", () => {
        const parsed = leadCustomerFormSchema.parse({
            ...createLeadCustomerFormDefaults(),
            companyName: "Örnek Plastik",
            phone: "0232 000 00 00",
            email: "   ",
        })

        expect(buildLeadCustomerPayload(parsed).email).toBeNull()
    })

    it("still rejects a non-empty invalid email", () => {
        const result = leadCustomerFormSchema.safeParse({
            ...createLeadCustomerFormDefaults(),
            companyName: "Örnek Plastik",
            phone: "0232 000 00 00",
            email: "gecersiz-adres",
        })

        expect(result.success).toBe(false)
    })

    it("sends every additional phone row (full replacement) and drops blank rows", () => {
        const parsed = leadCustomerFormSchema.parse({
            ...createLeadCustomerFormDefaults(),
            companyName: "Örnek Plastik",
            phone: "0232 000 00 00",
            email: "",
            additionalPhones: [
                { number: "0232 111 22 33", label: "Muhasebe" },
                { number: "", label: "" },
            ],
        })

        expect(buildLeadCustomerPayload(parsed).additionalPhones).toEqual([
            { number: "0232 111 22 33", label: "Muhasebe" },
        ])
    })

    it("flags an additional phone that repeats the primary line", () => {
        const result = leadCustomerFormSchema.safeParse({
            ...createLeadCustomerFormDefaults(),
            companyName: "Örnek Plastik",
            phone: "0232 000 00 00",
            email: "",
            additionalPhones: [{ number: "02320000000", label: "" }],
        })

        expect(result.success).toBe(false)
    })
})
