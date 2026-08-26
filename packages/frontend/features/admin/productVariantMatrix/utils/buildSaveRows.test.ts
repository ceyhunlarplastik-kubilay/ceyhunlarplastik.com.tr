import { describe, expect, it } from "vitest"

import { buildSaveRows } from "./buildSaveRows"
import { createEmptyDraftRow, parseMeasurementValue } from "../schema/variantMatrixSchema"
import type { MatrixRequirement } from "../api/types"

const armDiameter: MatrixRequirement = {
    id: "req-r",
    measurementTypeId: "mt-r",
    measurementCode: "R",
    label: "Kol Çapı",
    unit: "cm",
    isRequired: true,
    sortPriority: 0,
    displayOrder: 0,
}

const bushingMetric: MatrixRequirement = {
    id: "req-m",
    measurementTypeId: "mt-m",
    measurementCode: "M",
    label: "Burç Metriği",
    unit: null,
    isRequired: false,
    sortPriority: 1,
    displayOrder: 1,
}

const requirements = [armDiameter, bushingMetric]

/** V1 = Siyah + PP. Satırlar artık renk/hammadde değil BU versiyonu taşır. */
const versionDictionary = [
    { id: "ver-1", code: 1, colorId: "color-1", materialIds: ["mat-pp"] },
]

function build(rows: Parameters<typeof buildSaveRows>[0]["rows"]) {
    return buildSaveRows({ rows, requirements, productName: "10.5 Serisi Tapa", versionDictionary })
}

describe("parseMeasurementValue", () => {
    it("metrik diş kodunda M ön ekini kabul eder", () => {
        // Core'daki parseMeasurementInput ile AYNI kural: M/D metrik diştir.
        expect(parseMeasurementValue("M4", "M")).toBe(4)
        expect(parseMeasurementValue("m 12", "M")).toBe(12)
        expect(parseMeasurementValue("6", "D")).toBe(6)
    })

    it("diğer kodlarda virgülü ondalık ayırıcı sayar", () => {
        expect(parseMeasurementValue("12,5", "R")).toBe(12.5)
        expect(parseMeasurementValue("30", "R")).toBe(30)
    })

    it("geçersiz girdiyi reddeder", () => {
        expect(parseMeasurementValue("", "R")).toBeNull()
        expect(parseMeasurementValue("on cm", "R")).toBeNull()
        expect(parseMeasurementValue("M4", "R")).toBeNull()
        expect(parseMeasurementValue("M4x10", "M")).toBeNull()
    })
})

describe("buildSaveRows", () => {
    it("geçerli satırı API gövdesine çevirir", () => {
        const { rows, errors } = build([
            createEmptyDraftRow({
                measurements: { "req-r": "10", "req-m": "M4" },
                versionId: "ver-1",
                supplierId: "sup-x",
                price: "12,50",
                minOrderQty: "500",
                hasSupplierLogo: true,
            }),
        ])

        expect(errors).toEqual([])
        expect(rows).toHaveLength(1)
        expect(rows[0].measurements).toEqual([
            { requirementId: "req-r", value: 10 },
            { requirementId: "req-m", value: 4 },
        ])
        expect(rows[0].supplier).toMatchObject({
            supplierId: "sup-x",
            price: 12.5,
            minOrderQty: 500,
            hasSupplierLogo: true,
        })
    })

    it("varyant adını ölçülerden üretir", () => {
        const { rows } = build([
            createEmptyDraftRow({ measurements: { "req-r": "10" }, versionId: "ver-1" }),
        ])
        expect(rows[0].name).toBe("10.5 Serisi Tapa — Kol Çapı 10 cm")
    })

    it("zorunlu ölçü boşsa hata verir", () => {
        const { rows, errors } = build([
            createEmptyDraftRow({ measurements: { "req-m": "M4" }, versionId: "ver-1" }),
        ])
        expect(rows).toHaveLength(1)
        expect(errors).toEqual([{ index: 0, message: '"Kol Çapı" değeri geçersiz veya boş' }])
    })

    it("opsiyonel ölçü boşsa hata VERMEZ", () => {
        const { rows, errors } = build([
            createEmptyDraftRow({ measurements: { "req-r": "10" }, versionId: "ver-1" }),
        ])
        expect(errors).toEqual([])
        expect(rows[0].measurements).toEqual([{ requirementId: "req-r", value: 10 }])
    })

    it("hiç ölçü yoksa satırı atlar ve hata verir", () => {
        const { rows, errors } = build([createEmptyDraftRow({ measurements: {} })])
        expect(rows).toHaveLength(0)
        expect(errors.some((error) => error.message === "En az bir ölçü girilmeli")).toBe(true)
    })

    it("tedarikçi seçilmemişse supplier göndermez", () => {
        const { rows } = build([
            createEmptyDraftRow({ measurements: { "req-r": "10" }, versionId: "ver-1" }),
        ])
        expect(rows[0].supplier).toBeUndefined()
    })

    it("boş sayısal alanları payload'a koymaz", () => {
        const { rows } = build([
            createEmptyDraftRow({
                measurements: { "req-r": "10" },
                versionId: "ver-1",
                supplierId: "sup-x",
                price: "",
                minOrderQty: "   ",
            }),
        ])
        expect(rows[0].supplier?.price).toBeUndefined()
        expect(rows[0].supplier?.minOrderQty).toBeUndefined()
    })

    it("hata indeksleri satır sırasını korur", () => {
        const { errors } = build([
            createEmptyDraftRow({ measurements: { "req-r": "10" }, versionId: "ver-1" }),
            createEmptyDraftRow({ measurements: { "req-r": "" }, versionId: "ver-1" }),
        ])
        expect(errors.every((error) => error.index === 1)).toBe(true)
    })
})
