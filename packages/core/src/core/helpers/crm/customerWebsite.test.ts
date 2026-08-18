import { describe, expect, it } from "vitest"

import {
    InvalidWebsiteUrlError,
    formatWebsiteLabel,
    normalizeWebsiteUrl,
} from "./customerWebsite"

describe("normalizeWebsiteUrl", () => {
    it("şema yoksa https ekler", () => {
        expect(normalizeWebsiteUrl("acme.com")).toBe("https://acme.com")
    })

    it("mevcut şemayı korur", () => {
        expect(normalizeWebsiteUrl("http://acme.com")).toBe("http://acme.com")
    })

    it("host'u küçük harfe indirir", () => {
        expect(normalizeWebsiteUrl("HTTPS://Acme.COM")).toBe("https://acme.com")
    })

    it("kök yoldaki sondaki eğik çizgiyi atar", () => {
        expect(normalizeWebsiteUrl("https://acme.com/")).toBe("https://acme.com")
    })

    it("alt yolu korur", () => {
        expect(normalizeWebsiteUrl("acme.com/tr/urunler")).toBe("https://acme.com/tr/urunler")
    })

    it("www'yi saklamada korur (gösterimde atılır)", () => {
        expect(normalizeWebsiteUrl("www.acme.com")).toBe("https://www.acme.com")
    })

    it("protokol-bağımsız biçimi kabul eder", () => {
        expect(normalizeWebsiteUrl("//acme.com")).toBe("https://acme.com")
    })

    it("boş değerde null döner", () => {
        expect(normalizeWebsiteUrl("")).toBeNull()
        expect(normalizeWebsiteUrl("   ")).toBeNull()
        expect(normalizeWebsiteUrl(null)).toBeNull()
        expect(normalizeWebsiteUrl(undefined)).toBeNull()
    })

    it("javascript şemasını REDDEDER", () => {
        // Bu değer arayüzde link olarak render ediliyor.
        expect(() => normalizeWebsiteUrl("javascript:alert(1)")).toThrow(InvalidWebsiteUrlError)
    })

    it("ftp gibi diğer şemaları reddeder", () => {
        expect(() => normalizeWebsiteUrl("ftp://acme.com")).toThrow(InvalidWebsiteUrlError)
    })

    it("tek etiketli host'u reddeder", () => {
        expect(() => normalizeWebsiteUrl("acme")).toThrow(InvalidWebsiteUrlError)
    })

    it("host'suz şemayı reddeder", () => {
        expect(() => normalizeWebsiteUrl("https://")).toThrow(InvalidWebsiteUrlError)
    })
})

describe("formatWebsiteLabel", () => {
    it("şema ve www'yi atar", () => {
        expect(formatWebsiteLabel("https://www.acme.com")).toBe("acme.com")
    })

    it("alt yolu gösterir", () => {
        expect(formatWebsiteLabel("https://acme.com/tr")).toBe("acme.com/tr")
    })

    it("boş değerde null döner", () => {
        expect(formatWebsiteLabel(null)).toBeNull()
    })

    it("çözümlenemeyen değeri olduğu gibi verir", () => {
        expect(formatWebsiteLabel("acme")).toBe("acme")
    })
})
