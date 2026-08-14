import { describe, expect, it } from "vitest"

import {
    formatDiscountPercent,
    parseDiscountPercent,
    resolveCampaignValidity,
    resolveItemDiscountPercent,
} from "./campaignDiscount"

describe("parseDiscountPercent", () => {
    it("sayı ve metni okur", () => {
        expect(parseDiscountPercent(15)).toBe(15)
        expect(parseDiscountPercent("12.5")).toBe(12.5)
    })

    it("Prisma Decimal objesini okur", () => {
        // 25.00 → {s:1, e:1, d:[25]}
        expect(parseDiscountPercent({ s: 1, e: 1, d: [25] })).toBe(25)
    })

    it("boş değerde null döner", () => {
        expect(parseDiscountPercent(null)).toBeNull()
        expect(parseDiscountPercent(undefined)).toBeNull()
        expect(parseDiscountPercent("")).toBeNull()
    })
})

describe("resolveItemDiscountPercent", () => {
    it("kalem oranı doluysa onu kullanır", () => {
        expect(resolveItemDiscountPercent(15, 25)).toBe(25)
    })

    it("kalem oranı boşsa kampanya geneline düşer", () => {
        expect(resolveItemDiscountPercent(15, null)).toBe(15)
    })

    it("kalem oranı sıfırsa yine kalem oranı geçerlidir", () => {
        // 0 indirim "indirim yok" demektir; kampanya geneline DÜŞMEMELİ.
        expect(resolveItemDiscountPercent(15, 0)).toBe(0)
    })
})

describe("formatDiscountPercent", () => {
    it("tam sayıyı sade yazar", () => {
        expect(formatDiscountPercent(15)).toBe("%15")
    })

    it("ondalığı Türkçe ayraçla yazar", () => {
        expect(formatDiscountPercent(12.5)).toBe("%12,5")
    })

    it("boş değerde tire döner", () => {
        expect(formatDiscountPercent(null)).toBe("-")
    })
})

describe("resolveCampaignValidity", () => {
    const now = new Date("2026-08-14T12:00:00.000Z")

    it("tarih yoksa süregelen sayar", () => {
        expect(resolveCampaignValidity(null, null, now)).toBe("CURRENT")
    })

    it("başlangıç gelecekteyse planlanmış sayar", () => {
        expect(resolveCampaignValidity("2026-09-01T00:00:00.000Z", null, now)).toBe("SCHEDULED")
    })

    it("bitiş geçmişse süresi dolmuş sayar", () => {
        expect(resolveCampaignValidity(null, "2026-08-01T00:00:00.000Z", now)).toBe("EXPIRED")
    })

    it("pencere içindeyse süregelen sayar", () => {
        expect(resolveCampaignValidity("2026-08-01T00:00:00.000Z", "2026-08-31T00:00:00.000Z", now))
            .toBe("CURRENT")
    })
})
