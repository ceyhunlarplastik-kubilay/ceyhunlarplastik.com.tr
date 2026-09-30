import { describe, expect, it } from "vitest"

import type { ProductionMachine } from "@/features/production/machines/api/types"
import { filterProductionMachines } from "./filterProductionMachines"

const machine = (overrides: Partial<ProductionMachine>) => ({
    id: "m",
    code: "M-01",
    name: "Enjeksiyon",
    brand: null,
    model: null,
    areaId: "a1",
    status: "ACTIVE",
    ...overrides,
}) as ProductionMachine

const machines = [
    machine({ id: "1", code: "M-01", brand: "Yızumi", areaId: "a1" }),
    machine({ id: "2", code: "M-02", model: "Haitian MA1200", areaId: "a2", status: "MAINTENANCE" }),
    machine({ id: "3", code: "B-01", name: "İkinci hol presi", areaId: "a2" }),
]

const ids = (list: ProductionMachine[]) => list.map((entry) => entry.id)

describe("filterProductionMachines", () => {
    it("filtre yoksa hepsini döner", () => {
        expect(ids(filterProductionMachines(machines, { search: "", areaId: "", status: "" }))).toEqual(["1", "2", "3"])
    })

    it("alan ve durumla daraltır", () => {
        expect(ids(filterProductionMachines(machines, { search: "", areaId: "a2", status: "" }))).toEqual(["2", "3"])
        expect(ids(filterProductionMachines(machines, { search: "", areaId: "a2", status: "MAINTENANCE" }))).toEqual(["2"])
    })

    it("kod, ad, marka ve modelde Türkçe büyük/küçük harf duyarsız arar", () => {
        expect(ids(filterProductionMachines(machines, { search: "yızumi", areaId: "", status: "" }))).toEqual(["1"])
        expect(ids(filterProductionMachines(machines, { search: "haitian", areaId: "", status: "" }))).toEqual(["2"])
        expect(ids(filterProductionMachines(machines, { search: "ikinci", areaId: "", status: "" }))).toEqual(["3"])
    })
})
