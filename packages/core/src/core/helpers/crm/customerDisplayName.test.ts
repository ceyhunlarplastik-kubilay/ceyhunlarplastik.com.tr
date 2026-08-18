import { describe, expect, it } from "vitest"

import { resolveCustomerDisplayName, resolveCustomerNameParts } from "./customerDisplayName"

describe("resolveCustomerDisplayName", () => {
    it("firma adını tercih eder", () => {
        expect(resolveCustomerDisplayName({ companyName: "Acme A.Ş.", fullName: "Ali Veli" }))
            .toBe("Acme A.Ş.")
    })

    it("firma adı yoksa yetkili adına düşer", () => {
        expect(resolveCustomerDisplayName({ companyName: null, fullName: "Ali Veli" }))
            .toBe("Ali Veli")
    })

    it("ikisi de yoksa fallback döner", () => {
        expect(resolveCustomerDisplayName({ companyName: null, fullName: null }))
            .toBe("İsimsiz müşteri")
    })

    it("boşluktan oluşan değeri yok sayar", () => {
        expect(resolveCustomerDisplayName({ companyName: "   ", fullName: "Ali Veli" }))
            .toBe("Ali Veli")
    })

    it("null müşteride patlamaz", () => {
        expect(resolveCustomerDisplayName(null)).toBe("İsimsiz müşteri")
        expect(resolveCustomerDisplayName(undefined)).toBe("İsimsiz müşteri")
    })

    it("çağıran kendi fallback'ini verebilir", () => {
        expect(resolveCustomerDisplayName(null, "-")).toBe("-")
    })
})

describe("resolveCustomerNameParts", () => {
    it("ikisi varsa firma başlık, yetkili alt satır olur", () => {
        expect(resolveCustomerNameParts({ companyName: "Acme", fullName: "Ali" }))
            .toEqual({ title: "Acme", subtitle: "Ali" })
    })

    it("yalnız firma varsa alt satır boş kalır", () => {
        expect(resolveCustomerNameParts({ companyName: "Acme", fullName: null }))
            .toEqual({ title: "Acme", subtitle: null })
    })

    it("yalnız yetkili varsa o başlık olur", () => {
        expect(resolveCustomerNameParts({ companyName: null, fullName: "Ali" }))
            .toEqual({ title: "Ali", subtitle: null })
    })

    it("ikisi de yoksa fallback başlık olur", () => {
        expect(resolveCustomerNameParts({})).toEqual({ title: "İsimsiz müşteri", subtitle: null })
    })
})
