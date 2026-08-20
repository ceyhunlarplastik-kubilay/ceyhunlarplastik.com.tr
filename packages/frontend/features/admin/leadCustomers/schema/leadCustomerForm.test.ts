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
})
