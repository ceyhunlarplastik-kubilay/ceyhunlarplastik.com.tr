import { describe, expect, it } from "vitest"
import {
    normalizeCoordinateValue,
    parseManualCoordinates,
} from "@/features/customerLocations/lib/manualCoordinates"

describe("parseManualCoordinates", () => {
    it("accepts decimal comma and valid world coordinates", () => {
        expect(parseManualCoordinates("41,0082", "28,9784")).toEqual({
            success: true,
            latitude: 41.0082,
            longitude: 28.9784,
        })
    })

    it("rejects out-of-range values", () => {
        expect(parseManualCoordinates("91", "28")).toEqual({
            success: false,
            message: "Enlem -90 ile 90 arasında olmalı.",
        })
        expect(parseManualCoordinates("41", "181")).toEqual({
            success: false,
            message: "Boylam -180 ile 180 arasında olmalı.",
        })
    })

    it("boş veya yalnız boşluk içeren alanı 0 kabul etmez", () => {
        expect(parseManualCoordinates("", "")).toEqual({
            success: false,
            message: "Enlem -90 ile 90 arasında olmalı.",
        })
        expect(parseManualCoordinates("41.0082", "   ")).toEqual({
            success: false,
            message: "Boylam -180 ile 180 arasında olmalı.",
        })
        expect(normalizeCoordinateValue("", -90, 90)).toBeNull()
        expect(normalizeCoordinateValue("  ", -180, 180)).toBeNull()
        // Gerçek sıfır koordinatı hâlâ geçerlidir.
        expect(normalizeCoordinateValue("0", -90, 90)).toBe(0)
    })

    it("normalizes API decimal strings before the picker renders them", () => {
        expect(normalizeCoordinateValue("41.008200", -90, 90)).toBe(41.0082)
        expect(normalizeCoordinateValue("28.978400", -180, 180)).toBe(28.9784)
        expect(normalizeCoordinateValue("not-a-coordinate", -90, 90)).toBeNull()
    })
})
