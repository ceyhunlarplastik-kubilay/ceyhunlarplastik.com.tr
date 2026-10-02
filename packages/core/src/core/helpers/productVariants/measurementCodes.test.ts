import { describe, expect, it } from "vitest"

import { MeasurementCode } from "@/prisma/generated/prisma/enums"

import {
    MEASUREMENT_CODES,
    findMeasurementCodesMatching,
    formatMeasurementCode,
    isMeasurementCode,
} from "./measurementCodes"

describe("MEASUREMENT_CODES", () => {
    it("schema.prisma'daki MeasurementCode enum'u ile birebir aynı (sıra dahil)", () => {
        // Şemaya yeni kod eklenip bu liste güncellenmezse (ya da tersi) admin formunda kod
        // seçilemez ya da API 400 verir — burada yakalanır.
        expect([...MEASUREMENT_CODES]).toEqual(Object.values(MeasurementCode))
    })

    it("tekrarsız", () => {
        expect(new Set(MEASUREMENT_CODES).size).toBe(MEASUREMENT_CODES.length)
    })
})

describe("isMeasurementCode", () => {
    it("listedeki kodları kabul eder, diğerlerini reddeder", () => {
        expect(isMeasurementCode("P_T")).toBe(true)
        expect(isMeasurementCode("W_L")).toBe(true)
        expect(isMeasurementCode("R_L")).toBe(true)
        expect(isMeasurementCode("P-T")).toBe(false)
        expect(isMeasurementCode("all")).toBe(false)
        expect(isMeasurementCode(undefined)).toBe(false)
        expect(isMeasurementCode(5)).toBe(false)
    })
})

describe("formatMeasurementCode", () => {
    it("iki ölçülü kodu tireyle gösterir", () => {
        expect(formatMeasurementCode("R_L")).toBe("R-L")
        expect(formatMeasurementCode("P_T")).toBe("P-T")
        expect(formatMeasurementCode("W_L")).toBe("W-L")
    })

    it("tek ölçülü kodlara dokunmaz; boş girdi boş metin", () => {
        expect(formatMeasurementCode("PT")).toBe("PT")
        expect(formatMeasurementCode("H3")).toBe("H3")
        expect(formatMeasurementCode(null)).toBe("")
        expect(formatMeasurementCode(undefined)).toBe("")
    })
})

describe("findMeasurementCodesMatching", () => {
    it("ekrandaki tireli biçimle de, ham biçimle de bulur; harf duyarsız", () => {
        expect(findMeasurementCodesMatching("p-t")).toEqual(["P_T"])
        expect(findMeasurementCodesMatching("P_T")).toEqual(["P_T"])
        expect(findMeasurementCodesMatching("w-l")).toEqual(["W_L"])
    })

    it("parça eşleşmesi yapar: 'pt' yalnız PT'yi bulur (P-T'de bitişik 'pt' yok)", () => {
        expect(findMeasurementCodesMatching("pt")).toEqual(["PT"])
        expect(findMeasurementCodesMatching("-l")).toEqual(["R_L", "W_L"])
    })

    it("boş ya da eşleşmeyen metin boş liste", () => {
        expect(findMeasurementCodesMatching("")).toEqual([])
        expect(findMeasurementCodesMatching("   ")).toEqual([])
        expect(findMeasurementCodesMatching(undefined)).toEqual([])
        expect(findMeasurementCodesMatching("Çap")).toEqual([])
    })
})
