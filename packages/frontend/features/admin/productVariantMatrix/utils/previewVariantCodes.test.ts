import { describe, expect, it } from "vitest"

import { previewVariantCodes } from "./previewVariantCodes"
import type { MatrixRequirement, MatrixRow, MatrixSize, MatrixVersion } from "../api/types"

const req: MatrixRequirement = {
    id: "req-l", measurementTypeId: "mt-l", measurementCode: "L",
    label: "Uzunluk", unit: "cm", isRequired: true, sortPriority: 0, displayOrder: 0,
}

const black = { id: "color-black", system: "RAL", code: "9005" }
const pp = { id: "mat-pp", code: "PP", name: "Polipropilen" }

const sizes: MatrixSize[] = [
    { id: "s-10", code: 1, values: [{ requirementId: "req-l", value: 10 }] },
    { id: "s-30", code: 2, values: [{ requirementId: "req-l", value: 30 }] },
]
const versions: MatrixVersion[] = [
    { id: "v-1", code: "V1", colorId: "color-black", materialIds: ["mat-pp"] },
]
const supplierCodes = [
    { id: "psc-a", supplierId: "sup-x", supplierName: "X", code: "A" },
]
const rows: MatrixRow[] = [
    { variantId: "var-10", fullCode: "10.5.1.V1", name: "", sizeId: "s-10", versionId: "v-1",
      suppliers: [{ id: "vs-1", supplierId: "sup-x", supplierCode: "A", fullCode: "10.5.1.V1.A", isActive: true }] },
    { variantId: "var-30", fullCode: "10.5.2.V1", name: "", sizeId: "s-30", versionId: "v-1", suppliers: [] },
]

function preview(draftRows: Parameters<typeof previewVariantCodes>[0]["draftRows"], isLocked = false) {
    return previewVariantCodes({
        productCode: "10.5",
        isLocked,
        requirements: [req],
        sizes, versions, supplierCodes, rows,
        draftRows,
        colors: [black],
        materials: [pp],
    })
}

const draft = (value: number, supplierId?: string) => ({
    name: "x",
    measurements: [{ requirementId: "req-l", value }],
    colorId: "color-black",
    materialIds: ["mat-pp"],
    ...(supplierId ? { supplier: { supplierId } } : {}),
})

describe("previewVariantCodes", () => {
    it("taslak yoksa boş döner", () => {
        expect(preview([])).toEqual([])
    })

    it("kilitli üründe yeni ölçüyü sona ekler", () => {
        expect(preview([draft(40)], true)[0].fullCode).toBe("10.5.3.V1")
    })

    it("taslak modda araya giren ölçüyü doğru numaralar", () => {
        // 10 ve 30 var; 20 araya girince 2 numarayı alır, 30 üçe kayar.
        expect(preview([draft(20)])[0].fullCode).toBe("10.5.2.V1")
    })

    it("mevcut ölçüyü tekrar girince YENİ kod üretmez", () => {
        expect(preview([draft(10)])[0].fullCode).toBe("10.5.1.V1")
    })

    it("tedarikçili tam kodu üretir", () => {
        expect(preview([draft(40, "sup-x")], true)[0].supplierFullCode).toBe("10.5.3.V1.A")
    })

    it("yeni tedarikçiye sıradaki harfi verir", () => {
        expect(preview([draft(40, "sup-y")], true)[0].supplierFullCode).toBe("10.5.3.V1.B")
    })

    it("tedarikçi seçilmemişse tedarikçili kod null", () => {
        expect(preview([draft(40)], true)[0].supplierFullCode).toBeNull()
    })

    it("aynı ölçüyü iki tedarikçiyle girince ölçü kodu paylaşılır", () => {
        const result = preview([draft(40, "sup-x"), draft(40, "sup-y")], true)
        expect(result[0].fullCode).toBe("10.5.3.V1")
        expect(result[1].fullCode).toBe("10.5.3.V1")
        expect(result[0].supplierFullCode).toBe("10.5.3.V1.A")
        expect(result[1].supplierFullCode).toBe("10.5.3.V1.B")
    })

    it("yeni renk kombinasyonuna yeni versiyon verir", () => {
        const result = preview([{
            name: "x",
            measurements: [{ requirementId: "req-l", value: 10 }],
            colorId: undefined,
            materialIds: [],
        }], true)
        expect(result[0].fullCode).toBe("10.5.1.V2")
    })

    it("şablon yoksa sessizce null döner", () => {
        const result = previewVariantCodes({
            productCode: "10.5", isLocked: true, requirements: [],
            sizes: [], versions: [], supplierCodes: [], rows: [],
            draftRows: [draft(10)], colors: [], materials: [],
        })
        expect(result).toEqual([{ fullCode: null, supplierFullCode: null }])
    })

    it("tutarsız girdide çökmez", () => {
        const result = preview([{ name: "x", measurements: [{ requirementId: "yok", value: 1 }], materialIds: [] }])
        expect(result).toEqual([{ fullCode: null, supplierFullCode: null }])
    })
})
