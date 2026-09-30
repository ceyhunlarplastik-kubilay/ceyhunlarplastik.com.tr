import { describe, expect, it } from "vitest"

import type { Mold } from "@/features/production/molds/api/types"
import { filterMolds } from "./filterMolds"

const mold = (overrides: Partial<Mold>) => ({
    id: "m",
    code: "K-1",
    name: "Kalıp",
    status: "ACTIVE",
    storageLocation: null,
    outputs: [],
    ...overrides,
}) as Mold

const output = (sizeCode: string, productName: string) => ({
    size: { sizeCode },
    product: { code: sizeCode.split(".").slice(0, 2).join("."), name: productName },
}) as Mold["outputs"][number]

const molds = [
    mold({ id: "1", code: "K-1045", outputs: [output("1.3.8", "Elcik Tutamak")] }),
    mold({ id: "2", code: "K-2001", status: "IN_MAINTENANCE", storageLocation: "Raf B-3", outputs: [output("10.5.2", "İkili Kulp")] }),
]

const ids = (list: Mold[]) => list.map((entry) => entry.id)

describe("filterMolds", () => {
    it("bastığı ölçü kodu ve ürün modeli adıyla bulur (Türkçe İ/i duyarsız)", () => {
        expect(ids(filterMolds(molds, { search: "1.3.8", status: "" }))).toEqual(["1"])
        expect(ids(filterMolds(molds, { search: "ikili", status: "" }))).toEqual(["2"])
        expect(ids(filterMolds(molds, { search: "raf b", status: "" }))).toEqual(["2"])
    })

    it("durumla daraltır", () => {
        expect(ids(filterMolds(molds, { search: "", status: "IN_MAINTENANCE" }))).toEqual(["2"])
        expect(ids(filterMolds(molds, { search: "", status: "" }))).toEqual(["1", "2"])
    })
})
