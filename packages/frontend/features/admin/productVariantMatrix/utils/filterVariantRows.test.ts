import { describe, expect, it } from "vitest"

import { filterVariantRows, paginateVariantRows } from "./filterVariantRows"
import type { MatrixRow, MatrixSize, MatrixVersion } from "../api/types"

const sizes: MatrixSize[] = [
    { id: "s1", code: 1, values: [{ requirementId: "r1", value: 10 }] },
    { id: "s2", code: 2, values: [{ requirementId: "r1", value: 30 }] },
]

const versions: MatrixVersion[] = [
    { id: "v1", code: "V1", colorId: "black", materialIds: ["pp"] },
    { id: "v2", code: "V2", colorId: "white", materialIds: ["pp"] },
]

const rows: MatrixRow[] = [
    {
        variantId: "var1",
        fullCode: "10.5.1.V1",
        name: "Tapa 10",
        sizeId: "s1",
        versionId: "v1",
        suppliers: [
            { id: "vs1", supplierId: "supX", supplierCode: "A", fullCode: "10.5.1.V1.A", isActive: true, supplierVariantCode: "AS231" },
        ],
    },
    {
        variantId: "var2",
        fullCode: "10.5.2.V2",
        name: "Tapa 30",
        sizeId: "s2",
        versionId: "v2",
        suppliers: [
            { id: "vs2", supplierId: "supY", supplierCode: "B", fullCode: "10.5.2.V2.B", isActive: true },
        ],
    },
]

const noFilters = { q: "", supplierId: "", colorId: "" }

function run(filters: Partial<typeof noFilters>) {
    return filterVariantRows({ rows, sizes, versions, filters: { ...noFilters, ...filters } })
}

describe("filterVariantRows", () => {
    it("filtre yoksa hepsini döner ve sırayı korur", () => {
        expect(run({}).map((row) => row.variantId)).toEqual(["var1", "var2"])
    })

    it("varyant koduyla arar", () => {
        expect(run({ q: "10.5.2" }).map((row) => row.variantId)).toEqual(["var2"])
    })

    it("tedarikçili tam kodla arar", () => {
        expect(run({ q: "V1.A" }).map((row) => row.variantId)).toEqual(["var1"])
    })

    it("tedarikçinin kendi koduyla arar", () => {
        expect(run({ q: "as231" }).map((row) => row.variantId)).toEqual(["var1"])
    })

    it("ölçü DEĞERİYLE arar", () => {
        // Operatör katalogdan "30" diye arayıp o ölçüyü bulabilmeli.
        expect(run({ q: "30" }).map((row) => row.variantId)).toEqual(["var2"])
    })

    it("tedarikçiye göre filtreler", () => {
        expect(run({ supplierId: "supY" }).map((row) => row.variantId)).toEqual(["var2"])
    })

    it("renge göre filtreler", () => {
        expect(run({ colorId: "black" }).map((row) => row.variantId)).toEqual(["var1"])
    })

    it("filtreleri birlikte uygular", () => {
        expect(run({ supplierId: "supX", colorId: "white" })).toEqual([])
    })
})

describe("paginateVariantRows", () => {
    it("sayfayı böler ve toplamları hesaplar", () => {
        const result = paginateVariantRows(rows, 1, 1)
        expect(result.pageRows.map((row) => row.variantId)).toEqual(["var1"])
        expect(result.total).toBe(2)
        expect(result.totalPages).toBe(2)
    })

    it("aralık dışı sayfayı son sayfaya çeker", () => {
        // Filtre sonrası satır sayısı azaldığında kullanıcı boş ekran görmemeli.
        const result = paginateVariantRows(rows, 99, 1)
        expect(result.page).toBe(2)
        expect(result.pageRows.map((row) => row.variantId)).toEqual(["var2"])
    })

    it("boş listede tek sayfa döner", () => {
        const result = paginateVariantRows([], 1, 25)
        expect(result).toMatchObject({ total: 0, totalPages: 1, page: 1 })
    })
})
