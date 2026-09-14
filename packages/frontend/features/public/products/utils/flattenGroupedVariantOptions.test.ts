import { describe, expect, it } from "vitest"
import { flattenGroupedVariantOptions } from "./flattenGroupedVariantOptions"
import type { GroupedMeasurementOption } from "./groupedMeasurementOption"

/**
 * Regresyon testi — kubi'de yakalanan hata (2026-09-14): `/variant-table`
 * ölçüye göre gruplanmış satır döner (satırın kendisinde `id`/`fullCode` YOK),
 * ama 4 ekran (kampanya varyant seçici, özel fiyat diyalogları, tanımlı
 * varyant ataması) bunu düz `VariantTableData[]` sanıp doğrudan `variant.id`
 * okuyordu — hepsi `undefined` çıkıyor, React "duplicate key" uyarısı veriyor
 * ve backend'e geçersiz UUID gidiyordu.
 */
function buildOption(overrides: Partial<GroupedMeasurementOption> = {}): GroupedMeasurementOption {
    return {
        key: "mt-r:20",
        label: "Elcik Çapı: 20 mm",
        measurements: [
            {
                id: "m1",
                value: 20,
                label: "20",
                measurementType: { id: "mt-r", name: "Elcik Çapı", code: "R", baseUnit: "mm", displayOrder: 1 },
            },
        ],
        colors: [{ id: "color-1", name: "Kırmızı" }, { id: "color-2", name: "Mavi" }],
        materials: [{ id: "material-1", name: "Polipropilen", code: "PP" }],
        fullCodes: ["10.5.8.V1", "10.5.8.V2"],
        variants: [
            { id: "variant-1", fullCode: "10.5.8.V1", colorId: "color-1", materialIds: ["material-1"] },
            { id: "variant-2", fullCode: "10.5.8.V2", colorId: "color-2", materialIds: [] },
        ],
        ...overrides,
    } as GroupedMeasurementOption
}

describe("flattenGroupedVariantOptions", () => {
    it("her grup içindeki gerçek varyantları GERÇEK id/fullCode ile açar", () => {
        const flattened = flattenGroupedVariantOptions([buildOption()])

        expect(flattened).toHaveLength(2)
        expect(flattened.map((variant) => variant.id)).toEqual(["variant-1", "variant-2"])
        expect(flattened.map((variant) => variant.fullCode)).toEqual(["10.5.8.V1", "10.5.8.V2"])
    })

    it("colorId/materialIds'i grubun colors/materials dizisinden çözer", () => {
        const [first, second] = flattenGroupedVariantOptions([buildOption()])

        expect(first?.color?.name).toBe("Kırmızı")
        expect(first?.materials.map((material) => material.name)).toEqual(["Polipropilen"])
        expect(second?.color?.name).toBe("Mavi")
        expect(second?.materials).toEqual([])
    })

    it("her varyant grubun ölçü listesini paylaşır", () => {
        const [first, second] = flattenGroupedVariantOptions([buildOption()])

        expect(first?.measurements).toHaveLength(1)
        expect(second?.measurements).toBe(first?.measurements)
    })

    it("renk/hammadde yoksa yalnız ölçü etiketini isim olarak kullanır", () => {
        const [variant] = flattenGroupedVariantOptions([
            buildOption({
                variants: [{ id: "variant-3", fullCode: "10.5.8.V3", colorId: null, materialIds: [] }],
            }),
        ])

        expect(variant?.name).toBe("Elcik Çapı: 20 mm")
    })

    it("birden çok grup art arda açılır, gruplar arası id çakışması olmaz", () => {
        const flattened = flattenGroupedVariantOptions([
            buildOption(),
            buildOption({
                key: "mt-r:30",
                label: "Elcik Çapı: 30 mm",
                variants: [{ id: "variant-3", fullCode: "10.5.9.V1", colorId: null, materialIds: [] }],
            }),
        ])

        expect(flattened.map((variant) => variant.id)).toEqual(["variant-1", "variant-2", "variant-3"])
    })

    it("boş girdi için boş dizi döner", () => {
        expect(flattenGroupedVariantOptions([])).toEqual([])
    })
})
