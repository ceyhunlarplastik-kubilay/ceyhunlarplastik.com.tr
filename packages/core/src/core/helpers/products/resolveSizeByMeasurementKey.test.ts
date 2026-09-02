import { describe, expect, it } from "vitest"

import {
    resolveSizeIdByMeasurementKey,
    resolveSizeIdsByMeasurementKey,
} from "./resolveSizeByMeasurementKey"

const mt = (id: string) => ({ id, displayOrder: 0 })

/** values: [typeId, value] veya [typeId, value, isRequired] */
const size = (
    id: string,
    values: Array<[string, number] | [string, number, boolean]>,
) => ({
    id,
    values: values.map(([typeId, value, isRequired]) => ({
        value,
        requirement: { isRequired: isRequired ?? true, measurementType: mt(typeId) },
    })),
})

// 1.23: R + D zorunlu, H değil.
const withH = size("s1", [["mt-r", 20], ["mt-d", 5], ["mt-h", 17, false]])
const withoutH = size("s2", [["mt-r", 20], ["mt-d", 5]])
const other = size("s3", [["mt-r", 30], ["mt-d", 5], ["mt-h", 17, false]])

describe("resolveSizeIdsByMeasurementKey", () => {
    it("zorunlu-ölçü anahtarı hem opsiyonelli hem opsiyonelsiz ölçüyü bulur", () => {
        // Özet tablo anahtarı yalnız zorunlulardan kurulur.
        expect(
            resolveSizeIdsByMeasurementKey([withH, withoutH, other], "mt-r:20|mt-d:5"),
        ).toEqual(["s1", "s2"])
    })

    it("farklı zorunlu değeri olan ölçüyü dışarıda bırakır", () => {
        expect(
            resolveSizeIdsByMeasurementKey([withH, withoutH, other], "mt-r:30|mt-d:5"),
        ).toEqual(["s3"])
    })

    it("tüm-ölçü anahtarı da çalışır (eski dışa çıkmış ?m= bağlantıları)", () => {
        expect(
            resolveSizeIdsByMeasurementKey([withH, withoutH, other], "mt-r:20|mt-d:5|mt-h:17"),
        ).toEqual(["s1"])
    })

    it("boş anahtar boş dizi döndürür", () => {
        expect(resolveSizeIdsByMeasurementKey([withH], "")).toEqual([])
    })
})

describe("resolveSizeIdByMeasurementKey (tekil, tüm ölçü)", () => {
    it("tam eşleşmede id döndürür", () => {
        expect(
            resolveSizeIdByMeasurementKey([withH, withoutH], "mt-r:20|mt-d:5"),
        ).toBe("s2")
    })

    it("eşleşme yoksa null", () => {
        expect(resolveSizeIdByMeasurementKey([withH], "mt-r:99")).toBeNull()
    })
})
