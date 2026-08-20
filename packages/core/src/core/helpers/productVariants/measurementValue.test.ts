import { describe, expect, it } from "vitest"

import {
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
