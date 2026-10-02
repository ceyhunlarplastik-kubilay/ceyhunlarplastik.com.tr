import { describe, expect, it } from "vitest"

import {
    COMPOUND_MEASUREMENT_RAW_VALUE_PATTERN,
    isCompoundMeasurementRawValue,
    isMetricThreadMeasurementCode,
    normalizeMeasurementValue,
    parseMeasurementInput,
} from "./measurementValue"

describe("isMetricThreadMeasurementCode", () => {
    it("yalnız M ve D'yi metrik diş sayar", () => {
        expect(isMetricThreadMeasurementCode("M")).toBe(true)
        expect(isMetricThreadMeasurementCode("D")).toBe(true)
        expect(isMetricThreadMeasurementCode("R")).toBe(false)
        expect(isMetricThreadMeasurementCode(null)).toBe(false)
        expect(isMetricThreadMeasurementCode(undefined)).toBe(false)
    })
})

describe("normalizeMeasurementValue", () => {
    it("kayan nokta gürültüsünü ayıklar", () => {
        expect(normalizeMeasurementValue(0.1 + 0.2)).toBe(0.3)
        expect(normalizeMeasurementValue(12.00000001)).toBe(12)
    })

    it("sonlu olmayan değeri reddeder", () => {
        expect(() => normalizeMeasurementValue(Number.NaN)).toThrow(RangeError)
        expect(() => normalizeMeasurementValue(Number.POSITIVE_INFINITY)).toThrow(RangeError)
    })
})

describe("parseMeasurementInput — metrik diş", () => {
    it("M4 biçimini okur ve etiketi normalize eder", () => {
        expect(parseMeasurementInput("M4", "M")).toEqual({ value: 4, normalizedLabel: "M4" })
        expect(parseMeasurementInput("m4", "M")).toEqual({ value: 4, normalizedLabel: "M4" })
        expect(parseMeasurementInput("M 12", "M")).toEqual({ value: 12, normalizedLabel: "M12" })
    })

    it("M'siz girilen sayıya M ön eki ekler", () => {
        expect(parseMeasurementInput("6", "D")).toEqual({ value: 6, normalizedLabel: "M6" })
    })

    it("ondalık ayırıcı olarak virgülü kabul eder", () => {
        expect(parseMeasurementInput("M4,5", "M")).toEqual({ value: 4.5, normalizedLabel: "M4.5" })
    })

    it("harf içeren girdiyi reddeder", () => {
        expect(parseMeasurementInput("M4x10", "M")).toBeNull()
        expect(parseMeasurementInput("abc", "M")).toBeNull()
    })
})

describe("parseMeasurementInput — diğer ölçüler", () => {
    it("sayıyı olduğu gibi okur", () => {
        expect(parseMeasurementInput("10", "L")).toEqual({ value: 10, normalizedLabel: "10" })
        expect(parseMeasurementInput("12,5", "R")).toEqual({ value: 12.5, normalizedLabel: "12,5" })
    })

    it("boş girdi ve geçersiz sayıyı reddeder", () => {
        expect(parseMeasurementInput("", "L")).toBeNull()
        expect(parseMeasurementInput("   ", "L")).toBeNull()
        expect(parseMeasurementInput("on cm", "L")).toBeNull()
    })

    it("M ön ekini metrik olmayan kodda sayı saymaz", () => {
        expect(parseMeasurementInput("M4", "L")).toBeNull()
    })
})

describe("parseMeasurementInput — bileşik ölçü (10*30)", () => {
    it("'*' ayracıyla girilen bileşik değeri ilk sayıya ve birebir metne çözer", () => {
        expect(parseMeasurementInput("10*30", "H3")).toEqual({
            value: 10,
            normalizedLabel: "10*30",
            rawValue: "10*30",
        })
    })

    it("'x' ve '×' ayraçlarını da kabul eder, kanonik '*'e normalize eder", () => {
        expect(parseMeasurementInput("10x30", "H3")?.rawValue).toBe("10*30")
        expect(parseMeasurementInput("10 × 30", "H3")?.rawValue).toBe("10*30")
    })

    it("virgüllü ondalıkları da destekler", () => {
        expect(parseMeasurementInput("5,5*105", "H3")).toEqual({
            value: 5.5,
            normalizedLabel: "5.5*105",
            rawValue: "5.5*105",
        })
    })

    it("metrik diş kodunda bileşik değeri reddeder", () => {
        expect(parseMeasurementInput("10*30", "M")).toBeNull()
        expect(parseMeasurementInput("10/30", "D")).toBeNull()
        expect(parseMeasurementInput("10-30", "M")).toBeNull()
    })
})

describe("parseMeasurementInput — bileşik ölçü (10/30, 10-30)", () => {
    it("'/' ve '-' ayracını YAZILDIĞI GİBİ korur, sıralama sürrogatı yine ilk sayı", () => {
        expect(parseMeasurementInput("10/30", "P_T")).toEqual({
            value: 10,
            normalizedLabel: "10/30",
            rawValue: "10/30",
        })
        expect(parseMeasurementInput("10-30", "W_L")).toEqual({
            value: 10,
            normalizedLabel: "10-30",
            rawValue: "10-30",
        })
    })

    it("ayraç çevresindeki boşluğu siler, virgüllü ondalığı noktaya çevirir", () => {
        expect(parseMeasurementInput(" 10 / 30 ", "P_T")?.rawValue).toBe("10/30")
        expect(parseMeasurementInput("10 - 30", "R_L")?.rawValue).toBe("10-30")
        expect(parseMeasurementInput("5,5-10,25", "W_L")).toEqual({
            value: 5.5,
            normalizedLabel: "5.5-10.25",
            rawValue: "5.5-10.25",
        })
    })

    it("aynı sayılar farklı ayraçla farklı metin üretir (10*30 ≠ 10/30 ≠ 10-30)", () => {
        const raw = ["10*30", "10x30", "10/30", "10-30"].map((input) => parseMeasurementInput(input, "R_L")?.rawValue)
        expect(raw).toEqual(["10*30", "10*30", "10/30", "10-30"])
    })

    it("negatif tek sayı bileşik sayılmaz (açı gibi alanlar eskisi gibi)", () => {
        expect(parseMeasurementInput("-5", "A")).toEqual({ value: -5, normalizedLabel: "-5" })
    })

    it("eksik, fazla ya da karışık ayraçlı girdiyi reddeder", () => {
        for (const input of ["10--30", "10-", "/30", "10/30/40", "10*30-40", "10//30", "10 x", "10-30mm"]) {
            expect(parseMeasurementInput(input, "W_L"), input).toBeNull()
        }
    })
})

describe("COMPOUND_MEASUREMENT_RAW_VALUE_PATTERN", () => {
    it("ayrıştırıcının ürettiği her bileşik metni kabul eder", () => {
        for (const input of ["10*30", "10x30", "10 × 30", "10/30", "10 - 30", "5,5*105", "0.25/0.5"]) {
            const rawValue = parseMeasurementInput(input, "H3")?.rawValue
            expect(rawValue, input).toBeDefined()
            expect(COMPOUND_MEASUREMENT_RAW_VALUE_PATTERN.test(rawValue as string), input).toBe(true)
        }
    })

    it("kanonik olmayan ya da serbest metni reddeder", () => {
        for (const value of ["10x30", "10 * 30", "10,5*30", "10*", "abc", "10*30*40", "-10-30", ""]) {
            expect(isCompoundMeasurementRawValue(value), value).toBe(false)
        }
        expect(isCompoundMeasurementRawValue(null)).toBe(false)
        expect(isCompoundMeasurementRawValue(10)).toBe(false)
        expect(isCompoundMeasurementRawValue("10-30")).toBe(true)
    })

    it("ajv'nin kullandığı Unicode kipinde de derlenir ve aynı sonucu verir", () => {
        const unicode = new RegExp(COMPOUND_MEASUREMENT_RAW_VALUE_PATTERN.source, "u")
        expect(unicode.test("10/30")).toBe(true)
        expect(unicode.test("10-30")).toBe(true)
        expect(unicode.test("10x30")).toBe(false)
    })
})
