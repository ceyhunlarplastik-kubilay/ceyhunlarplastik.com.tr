import { describe, expect, it } from "vitest"

import { buildDraftFromRow, decimalLikeToText } from "./buildDraftFromRow"
import type { MatrixRow, MatrixSize, MatrixVersion } from "../api/types"

const sizes: MatrixSize[] = [
    { id: "s1", code: 1, values: [{ requirementId: "r1", value: 10 }, { requirementId: "r2", value: 4 }] },
]
const versions: MatrixVersion[] = [{ id: "v1", code: "V1", colorId: "black", materialIds: ["pp", "pe"] }]

const row: MatrixRow = {
    variantId: "var1",
    fullCode: "10.5.1.V1",
    name: "Tapa",
    sizeId: "s1",
    versionId: "v1",
    suppliers: [{
        id: "vs1",
        supplierId: "supX",
        supplierCode: "A",
        fullCode: "10.5.1.V1.A",
        isActive: true,
        supplierVariantCode: "AS231",
        hasSupplierLogo: true,
        minOrderQty: 500,
        unitsPerPackage: 100,
        minLeadTimeDays: 14,
        price: 12.5,
    }],
}

describe("decimalLikeToText", () => {
    it("Prisma Decimal objesini metne çevirir", () => {
        expect(decimalLikeToText({ s: 1, e: 1, d: [12, 5] })).not.toBe("")
        expect(decimalLikeToText(12.5)).toBe("12.5")
        expect(decimalLikeToText("7")).toBe("7")
    })

    it("boş değerlerde boş metin döner", () => {
        expect(decimalLikeToText(null)).toBe("")
        expect(decimalLikeToText(undefined)).toBe("")
    })
})

describe("buildDraftFromRow", () => {
    it("ölçüleri metin olarak taşır", () => {
        const draft = buildDraftFromRow({ row, sizes, versions })
        expect(draft.measurements).toEqual({ r1: "10", r2: "4" })
    })

    it("renk ve hammaddeleri taşır", () => {
        const draft = buildDraftFromRow({ row, sizes, versions })
        expect(draft.colorId).toBe("black")
        expect(draft.materialIds).toEqual(["pp", "pe"])
    })

    it("tedarikçinin ticari ve lojistik alanlarını taşır", () => {
        const draft = buildDraftFromRow({ row, sizes, versions })
        expect(draft).toMatchObject({
            supplierId: "supX",
            supplierVariantCode: "AS231",
            hasSupplierLogo: true,
            minOrderQty: "500",
            unitsPerPackage: "100",
            minLeadTimeDays: "14",
            price: "12.5",
        })
    })

    it("belirli bir tedarikçi verilirse onu kullanır", () => {
        const draft = buildDraftFromRow({
            row,
            sizes,
            versions,
            supplier: { id: "vs2", supplierId: "supY", supplierCode: "B", fullCode: null, isActive: false },
        })
        expect(draft.supplierId).toBe("supY")
        expect(draft.supplierVariantCode).toBeUndefined()
    })

    it("tedarikçisi olmayan satırda çökmez", () => {
        const draft = buildDraftFromRow({ row: { ...row, suppliers: [] }, sizes, versions })
        expect(draft.supplierId).toBeUndefined()
        expect(draft.measurements).toEqual({ r1: "10", r2: "4" })
    })
})
