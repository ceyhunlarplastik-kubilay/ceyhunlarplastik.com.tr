import { describe, expect, it } from "vitest"

import {
    buildMeasurementKey,
    formatMeasurementValue,
    resolveMeasurementName,
    resolveMeasurementUnit,
    toMeasurementLabel,
} from "./measurementDisplay"

function m(over: Partial<Parameters<typeof formatMeasurementValue>[0]> = {}) {
    return {
        id: "sv-1",
        value: 20,
        label: "Elcik Çapı",
        unit: "cm",
        measurementType: { id: "mt-r", name: "Çap", code: "R", baseUnit: "mm", displayOrder: 0 },
        ...over,
    }
}

const metric = m({
    value: 4,
    label: "Burç Metriği",
    unit: null,
    measurementType: { id: "mt-m", name: "Metrik", code: "M", baseUnit: "mm", displayOrder: 1 },
})

describe("formatMeasurementValue", () => {
    it("değeri sayıdan üretir, ETİKETTEN değil", () => {
        // Regresyon: eskiden `label` değer metni sanılıyordu; yeni modelde label
        // ürün modeline özel ölçü ADI, o yüzden değerin yerine ad basılıyordu.
        expect(formatMeasurementValue(m())).toBe("20")
        expect(formatMeasurementValue(m())).not.toBe("Elcik Çapı")
    })

    it("metrik diş kodlarında M ön eki ekler", () => {
        expect(formatMeasurementValue(metric)).toBe("M4")
        expect(formatMeasurementValue(m({ value: 6, measurementType: { id: "mt-d", name: "Metrik", code: "D", baseUnit: "mm", displayOrder: 0 } }))).toBe("M6")
    })

    it("gereksiz ondalıkları kırpar", () => {
        expect(formatMeasurementValue(m({ value: 12.5 }))).toBe("12.5")
        expect(formatMeasurementValue(m({ value: 20.0 }))).toBe("20")
    })
})

describe("resolveMeasurementName", () => {
    it("ürün modeline özel etiketi tercih eder", () => {
        expect(resolveMeasurementName(m())).toBe("Elcik Çapı")
    })

    it("etiket yoksa ölçü tipinin adına düşer", () => {
        expect(resolveMeasurementName(m({ label: "" }))).toBe("Çap")
    })
})

describe("resolveMeasurementUnit", () => {
    it("şablon birimini kullanır", () => {
        expect(resolveMeasurementUnit(m())).toBe("cm")
    })

    it("şablonda birim yoksa taban birime düşer", () => {
        expect(resolveMeasurementUnit(m({ unit: null }))).toBe("mm")
    })

    it("metrik dişte birim GÖSTERMEZ", () => {
        // "M4 mm" anlamsız olurdu.
        expect(resolveMeasurementUnit(metric)).toBeNull()
    })
})

describe("buildMeasurementKey", () => {
    it("ölçü tipi ve değerden üretir", () => {
        expect(buildMeasurementKey([m(), metric])).toBe("mt-r:20|mt-m:4")
    })

    it("girdi sırasından bağımsızdır", () => {
        expect(buildMeasurementKey([metric, m()])).toBe(buildMeasurementKey([m(), metric]))
    })

    it("ETİKETİ anahtara KOYMAZ — dil değişince seçim sıfırlanmamalı", () => {
        const tr = buildMeasurementKey([m({ label: "Elcik Çapı" })])
        const en = buildMeasurementKey([m({ label: "Handle Diameter" })])
        expect(tr).toBe(en)
    })
})

describe("toMeasurementLabel", () => {
    it("ad, değer ve birimi birleştirir", () => {
        expect(toMeasurementLabel([m(), metric])).toBe("Elcik Çapı: 20 cm · Burç Metriği: M4")
    })
})
