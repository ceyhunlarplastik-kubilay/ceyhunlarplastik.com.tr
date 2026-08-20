import { describe, expect, it } from "vitest"

import {
    buildSizeSignature,
    buildSizeSortKey,
    compareSizeKeys,
    orderMeasurementRequirements,
    type MeasurementRequirementLike,
} from "./sizeSignature"

// "1.8" ürün modeli şablonu: Kol Çapı (R), Kol Yüksekliği (H1), Burç Metriği (D).
const armDiameter: MeasurementRequirementLike = {
    id: "req-r",
    measurementCode: "R",
    label: "Kol Çapı",
    sortPriority: 0,
    displayOrder: 0,
}
const armHeight: MeasurementRequirementLike = {
    id: "req-h1",
    measurementCode: "H1",
    label: "Kol Yüksekliği",
    sortPriority: 1,
    displayOrder: 1,
}
const bushingMetric: MeasurementRequirementLike = {
    id: "req-d",
    measurementCode: "D",
    label: "Burç Metriği",
    sortPriority: 2,
    displayOrder: 2,
}

const requirements = [bushingMetric, armDiameter, armHeight]

function sizeKeys(values: Array<{ requirementId: string; value: number }>) {
    return {
        signature: buildSizeSignature(values, requirements),
        sortKey: buildSizeSortKey(values, requirements),
    }
}

describe("orderMeasurementRequirements", () => {
    it("sortPriority sırasına göre dizer", () => {
        expect(orderMeasurementRequirements(requirements).map((r) => r.measurementCode)).toEqual(["R", "H1", "D"])
    })

    it("girdiyi mutasyona uğratmaz", () => {
        const input = [...requirements]
        orderMeasurementRequirements(input)
        expect(input).toEqual(requirements)
    })
})

describe("buildSizeSignature", () => {
    it("değerleri şablon sırasına göre kanonik metne çevirir", () => {
        expect(sizeKeys([
            { requirementId: "req-r", value: 20 },
            { requirementId: "req-h1", value: 40 },
            { requirementId: "req-d", value: 6 },
        ]).signature).toBe("R#Kol Çapı=20.0000|H1#Kol Yüksekliği=40.0000|D#Burç Metriği=6.0000")
    })

    it("girdi sırasından bağımsızdır — aynı ölçü tek kod alır", () => {
        // Aynı fiziksel ölçü iki farklı tedarikçi kataloğundan farklı sırada girildi.
        const supplierA = sizeKeys([
            { requirementId: "req-r", value: 20 },
            { requirementId: "req-d", value: 6 },
        ])
        const supplierB = sizeKeys([
            { requirementId: "req-d", value: 6 },
            { requirementId: "req-r", value: 20 },
        ])
        expect(supplierA.signature).toBe(supplierB.signature)
    })

    it("kayan nokta gürültüsünü tekilleştirir", () => {
        const a = sizeKeys([{ requirementId: "req-r", value: 0.1 + 0.2 }])
        const b = sizeKeys([{ requirementId: "req-r", value: 0.3 }])
        expect(a.signature).toBe(b.signature)
    })

    it("eksik opsiyonel ölçüyü dolu olandan ayırır", () => {
        const withHeight = sizeKeys([
            { requirementId: "req-r", value: 20 },
            { requirementId: "req-h1", value: 40 },
        ])
        const withoutHeight = sizeKeys([{ requirementId: "req-r", value: 20 }])
        expect(withHeight.signature).not.toBe(withoutHeight.signature)
    })

    it("bilinmeyen gereksinimi ve tekrar eden değeri reddeder", () => {
        expect(() => buildSizeSignature([{ requirementId: "req-x", value: 1 }], requirements)).toThrow(RangeError)
        expect(() =>
            buildSizeSignature(
                [
                    { requirementId: "req-r", value: 1 },
                    { requirementId: "req-r", value: 2 },
                ],
                requirements,
            ),
        ).toThrow(RangeError)
    })

    it("değersiz ölçü kaydını reddeder", () => {
        expect(() => buildSizeSignature([], requirements)).toThrow(RangeError)
    })
})

describe("buildSizeSortKey", () => {
    function sortedSignatures(entries: Array<Array<{ requirementId: string; value: number }>>) {
        return entries
            .map(sizeKeys)
            .sort(compareSizeKeys)
            .map((entry) => entry.signature)
    }

    it("tek ölçüde küçükten büyüğe sıralar", () => {
        const ordered = sortedSignatures([
            [{ requirementId: "req-r", value: 30 }],
            [{ requirementId: "req-r", value: 10 }],
            [{ requirementId: "req-r", value: 12 }],
        ])
        expect(ordered).toEqual([
            "R#Kol Çapı=10.0000",
            "R#Kol Çapı=12.0000",
            "R#Kol Çapı=30.0000",
        ])
    })

    it("sözlüksel değil SAYISAL sıralar", () => {
        // Ham metin karşılaştırmasında "100" < "20" olurdu.
        const ordered = sortedSignatures([
            [{ requirementId: "req-r", value: 100 }],
            [{ requirementId: "req-r", value: 20 }],
        ])
        expect(ordered[0]).toContain("20.0000")
    })

    it("çok ölçüde şablon önceliğine göre sırayla karşılaştırır", () => {
        // Önce Kol Çapı (R), eşitse Kol Yüksekliği (H1), eşitse Burç Metriği (D).
        const ordered = sortedSignatures([
            [
                { requirementId: "req-r", value: 20 },
                { requirementId: "req-h1", value: 60 },
            ],
            [
                { requirementId: "req-r", value: 20 },
                { requirementId: "req-h1", value: 40 },
            ],
            [
                { requirementId: "req-r", value: 10 },
                { requirementId: "req-h1", value: 90 },
            ],
        ])
        expect(ordered).toEqual([
            "R#Kol Çapı=10.0000|H1#Kol Yüksekliği=90.0000",
            "R#Kol Çapı=20.0000|H1#Kol Yüksekliği=40.0000",
            "R#Kol Çapı=20.0000|H1#Kol Yüksekliği=60.0000",
        ])
    })

    it("kullanıcı örneği: M4 + 10 cm ikilisi metrik önce sıralanır", () => {
        // Burç Metriği önceliği en düşük olduğu için Kol Çapı baskındır.
        const ordered = sortedSignatures([
            [
                { requirementId: "req-r", value: 10 },
                { requirementId: "req-d", value: 6 },
            ],
            [
                { requirementId: "req-r", value: 10 },
                { requirementId: "req-d", value: 4 },
            ],
        ])
        expect(ordered[0]).toContain("D#Burç Metriği=4.0000")
    })

    it("eksik ölçü dolu ölçüden önce gelir", () => {
        const ordered = sortedSignatures([
            [
                { requirementId: "req-r", value: 10 },
                { requirementId: "req-h1", value: 1 },
            ],
            [{ requirementId: "req-r", value: 10 }],
        ])
        expect(ordered[0]).toBe("R#Kol Çapı=10.0000")
    })

    it("negatif değeri de doğru sıralar", () => {
        const ordered = sortedSignatures([
            [{ requirementId: "req-r", value: 5 }],
            [{ requirementId: "req-r", value: -5 }],
            [{ requirementId: "req-r", value: 0 }],
        ])
        expect(ordered.map((signature) => signature.split("=")[1])).toEqual(["-5.0000", "0.0000", "5.0000"])
    })

    it("sıralanamayacak kadar büyük değeri reddeder", () => {
        expect(() => buildSizeSortKey([{ requirementId: "req-r", value: 1e9 }], requirements)).toThrow(RangeError)
    })
})
