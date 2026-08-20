import { describe, expect, it } from "vitest"

import {
    buildVariantFullCode,
    buildVariantSupplierFullCode,
    formatSupplierCode,
    formatVersionCode,
    nextSupplierCode,
    parseSupplierCode,
    parseVariantFullCode,
    parseVersionCode,
} from "./variantCode"

describe("formatVersionCode / parseVersionCode", () => {
    it("versiyon sırasını koda çevirir ve geri okur", () => {
        expect(formatVersionCode(1)).toBe("V1")
        expect(formatVersionCode(12)).toBe("V12")
        expect(parseVersionCode("V12")).toBe(12)
        expect(parseVersionCode("v3")).toBe(3)
    })

    it("geçersiz sırayı reddeder", () => {
        expect(() => formatVersionCode(0)).toThrow(RangeError)
        expect(() => formatVersionCode(1.5)).toThrow(RangeError)
        expect(parseVersionCode("V0")).toBeNull()
        expect(parseVersionCode("X1")).toBeNull()
    })
})

describe("formatSupplierCode / parseSupplierCode", () => {
    it("bijektif 26 tabanı üretir", () => {
        expect(formatSupplierCode(1)).toBe("A")
        expect(formatSupplierCode(26)).toBe("Z")
        expect(formatSupplierCode(27)).toBe("AA")
        expect(formatSupplierCode(52)).toBe("AZ")
        expect(formatSupplierCode(53)).toBe("BA")
    })

    it("her sıra için gidiş-dönüş kararlıdır", () => {
        for (const order of [1, 2, 25, 26, 27, 52, 53, 100, 702, 703]) {
            expect(parseSupplierCode(formatSupplierCode(order))).toBe(order)
        }
    })

    it("geçersiz kodu reddeder", () => {
        expect(parseSupplierCode("A1")).toBeNull()
        expect(parseSupplierCode("")).toBeNull()
        expect(() => formatSupplierCode(0)).toThrow(RangeError)
    })
})

describe("nextSupplierCode", () => {
    it("boş listede A verir", () => {
        expect(nextSupplierCode([])).toBe("A")
    })

    it("en büyük harften devam eder", () => {
        expect(nextSupplierCode(["A", "B"])).toBe("C")
        expect(nextSupplierCode(["Z"])).toBe("AA")
    })

    it("aradan çıkarılan tedarikçinin boşluğunu DOLDURMAZ", () => {
        // "B" tedarikçisi ürün modelinden çıkarılmış olsa bile C'den devam edilir:
        // verilmiş bir harf başka tedarikçiye devredilemez.
        expect(nextSupplierCode(["A", "C"])).toBe("D")
    })
})

describe("buildVariantFullCode", () => {
    it("yeni segment sırasını üretir", () => {
        expect(buildVariantFullCode({ productCode: "10.5", sizeCode: 8, versionOrder: 1 })).toBe("10.5.8.V1")
    })

    it("ürün kodunu olduğu gibi kullanır", () => {
        expect(buildVariantFullCode({ productCode: "1.9", sizeCode: 12, versionOrder: 3 })).toBe("1.9.12.V3")
    })

    it("geçersiz ölçü kodunu reddeder", () => {
        expect(() => buildVariantFullCode({ productCode: "10.5", sizeCode: 0, versionOrder: 1 })).toThrow(RangeError)
        expect(() => buildVariantFullCode({ productCode: "  ", sizeCode: 1, versionOrder: 1 })).toThrow(RangeError)
    })
})

describe("buildVariantSupplierFullCode", () => {
    it("tedarikçi harfini sona ekler", () => {
        expect(buildVariantSupplierFullCode("10.5.8.V1", "A")).toBe("10.5.8.V1.A")
        expect(buildVariantSupplierFullCode("10.5.8.V1", "aa")).toBe("10.5.8.V1.AA")
    })

    it("harf olmayan tedarikçi kodunu reddeder", () => {
        expect(() => buildVariantSupplierFullCode("10.5.8.V1", "A1")).toThrow(RangeError)
    })
})

describe("parseVariantFullCode", () => {
    it("varyant kodunu sondan ayrıştırır", () => {
        expect(parseVariantFullCode("10.5.8.V1")).toEqual({
            productCode: "10.5",
            sizeCode: 8,
            versionOrder: 1,
            supplierCode: null,
        })
    })

    it("tedarikçili kodu ayrıştırır", () => {
        expect(parseVariantFullCode("10.5.8.V1.A")).toEqual({
            productCode: "10.5",
            sizeCode: 8,
            versionOrder: 1,
            supplierCode: "A",
        })
    })

    it("ürün kodu nokta içerse de doğru böler", () => {
        // SuppliersPageClient'taki `split(".").slice(0, 2)` hack'inin çözdüğü sorun.
        expect(parseVariantFullCode("1.9.12.V3.B")?.productCode).toBe("1.9")
    })

    it("bozuk kodu reddeder", () => {
        expect(parseVariantFullCode("10.5.V1")).toBeNull()
        expect(parseVariantFullCode("10.5.8.X1")).toBeNull()
        expect(parseVariantFullCode("10.5.abc.V1")).toBeNull()
        expect(parseVariantFullCode("")).toBeNull()
    })

    it("eski biçimi yeni biçim gibi okumaz", () => {
        // Eski kod "10.5.A.V1.8" — 3. segment harf, son segment sayı.
        expect(parseVariantFullCode("10.5.A.V1.8")).toBeNull()
    })
})
