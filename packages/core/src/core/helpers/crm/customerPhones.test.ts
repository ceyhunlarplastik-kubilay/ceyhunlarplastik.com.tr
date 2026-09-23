import { describe, expect, it } from "vitest"

import {
    CUSTOMER_ADDITIONAL_PHONE_LIMIT,
    customerPhoneHref,
    customerPhoneKey,
    listCustomerPhones,
    normalizeCustomerAdditionalPhones,
} from "./customerPhones"

describe("listCustomerPhones", () => {
    it("birincil numarayı öne alır, ek numaraları displayOrder'a göre sıralar", () => {
        expect(listCustomerPhones({
            phone: " 0532 000 00 00 ",
            additionalPhones: [
                { number: "0212 777 88 99", label: null, displayOrder: 1 },
                { number: "0232 111 22 33", label: "Muhasebe", displayOrder: 0 },
            ],
        })).toEqual([
            { number: "0532 000 00 00", label: null, isPrimary: true },
            { number: "0232 111 22 33", label: "Muhasebe", isPrimary: false },
            { number: "0212 777 88 99", label: null, isPrimary: false },
        ])
    })

    it("ek numara taşımayan (eski) yanıtlarda yalnız birincili döndürür", () => {
        expect(listCustomerPhones({ phone: "0532 000 00 00" })).toEqual([
            { number: "0532 000 00 00", label: null, isPrimary: true },
        ])
        expect(listCustomerPhones({ phone: "", additionalPhones: null })).toEqual([])
    })
})

describe("customerPhoneHref", () => {
    it("tanınan numarayı E.164'e, tanınmayanı rakamlara indirir", () => {
        expect(customerPhoneHref("0532 000 00 00")).toBe("tel:+905320000000")
        expect(customerPhoneHref("(0232) 111-22-33")).toBe("tel:+902321112233")
        expect(customerPhoneHref("444 0 123")).toBe("tel:4440123")
    })
})

describe("customerPhoneKey", () => {
    it("aynı hattın farklı yazımlarını aynı anahtara indirir", () => {
        const key = customerPhoneKey("0532 000 00 00")

        expect(customerPhoneKey("+90 532 000 00 00")).toBe(key)
        expect(customerPhoneKey("905320000000")).toBe(key)
        expect(customerPhoneKey("(0532) 000-00-00")).toBe(key)
        expect(customerPhoneKey("0232 000 00 00")).not.toBe(key)
    })

    it("E.164'e inmeyen kısa numarada rakamları karşılaştırır", () => {
        expect(customerPhoneKey("444 0 123")).toBe(customerPhoneKey("4440123"))
        expect(customerPhoneKey("444 0 123")).not.toBe(customerPhoneKey("444 0 124"))
    })
})

describe("normalizeCustomerAdditionalPhones", () => {
    it("kırpar, boş numarayı atar, boş etiketi null yapar ve sırayı yeniden numaralar", () => {
        expect(normalizeCustomerAdditionalPhones([
            { number: "   ", label: "Boş" },
            { number: " 0232 111 22 33 ", label: "  Muhasebe " },
            { number: "0533 444 55 66", label: "   " },
            { number: "0212 777 88 99" },
        ])).toEqual([
            { number: "0232 111 22 33", label: "Muhasebe", displayOrder: 0 },
            { number: "0533 444 55 66", label: null, displayOrder: 1 },
            { number: "0212 777 88 99", label: null, displayOrder: 2 },
        ])
    })

    it("birincil numarayla aynı hattı ek numara olarak yazmaz", () => {
        expect(normalizeCustomerAdditionalPhones(
            [
                { number: "+90 532 000 00 00", label: "Cep" },
                { number: "0232 111 22 33", label: "Muhasebe" },
            ],
            { primaryPhone: "0532 000 00 00" },
        )).toEqual([
            { number: "0232 111 22 33", label: "Muhasebe", displayOrder: 0 },
        ])
    })

    it("listede tekrar eden hattın ilkini tutar", () => {
        expect(normalizeCustomerAdditionalPhones([
            { number: "0232 111 22 33", label: "Muhasebe" },
            { number: "02321112233", label: "Satın Alma" },
        ])).toEqual([
            { number: "0232 111 22 33", label: "Muhasebe", displayOrder: 0 },
        ])
    })

    it("limitin üstünü atar", () => {
        const phones = Array.from({ length: CUSTOMER_ADDITIONAL_PHONE_LIMIT + 3 }, (_, index) => ({
            number: `0232 111 22 ${String(index).padStart(2, "0")}`,
        }))

        const normalized = normalizeCustomerAdditionalPhones(phones)
        expect(normalized).toHaveLength(CUSTOMER_ADDITIONAL_PHONE_LIMIT)
        expect(normalized.at(-1)?.displayOrder).toBe(CUSTOMER_ADDITIONAL_PHONE_LIMIT - 1)
    })

    it("boş liste boş döner (tüm ek numaraları silme isteği)", () => {
        expect(normalizeCustomerAdditionalPhones([], { primaryPhone: "0532 000 00 00" })).toEqual([])
    })
})
