import { describe, expect, it } from "vitest"

import { productionChangeQueryKeys } from "./productionChangeQueryKeys"

describe("canlı güncellemede tazelenecek sorgular", () => {
    it("plan: tahta, emirler, pano, lotlar, kalıplar (sayaç) ve istatistikler", () => {
        expect(productionChangeQueryKeys(["plan"])).toEqual([
            ["production", "board"],
            ["production", "orders"],
            ["production", "kanban"],
            ["production", "lots"],
            ["production", "molds"],
            ["production", "stats"],
        ])
    })

    it("birden çok alan tekilleşir; tanımlar her şeyi tazeler", () => {
        expect(productionChangeQueryKeys(["roster", "lots", "lots"])).toEqual([
            ["production", "roster"],
            ["production", "lots"],
        ])
        expect(productionChangeQueryKeys(["reasons"])).toEqual([["production", "reasons"]])
        expect(productionChangeQueryKeys(["plan", "definitions"])).toEqual([["production"]])
        expect(productionChangeQueryKeys([])).toEqual([])
    })
})
