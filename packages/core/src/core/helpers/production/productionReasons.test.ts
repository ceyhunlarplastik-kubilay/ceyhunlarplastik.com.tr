import { describe, expect, it } from "vitest"

import {
    DEFAULT_PRODUCTION_REASONS,
    findReasonIssues,
    missingDefaultReasons,
    normalizeReasonCode,
} from "./productionReasons"

describe("neden sözlüğü", () => {
    it("kod normalleşir; duruşta kategori zorunlu, firede yasak", () => {
        expect(normalizeReasonCode(" d01 ")).toBe("D01")
        expect(normalizeReasonCode("kalip-ayar")).toBe("KALIP-AYAR")
        expect(findReasonIssues({ kind: "STOP", code: "d01", name: "Kalıp arızası", stopCategory: "BREAKDOWN" })).toEqual([])
        expect(findReasonIssues({ kind: "STOP", code: "D01", name: "x", stopCategory: null }).map((issue) => issue.field)).toEqual(["stopCategory"])
        expect(findReasonIssues({ kind: "SCRAP", code: "F01", name: "Çapak", stopCategory: "OTHER" }).map((issue) => issue.field)).toEqual(["stopCategory"])
        expect(findReasonIssues({ kind: "SCRAP", code: "Ç01", name: "  ", stopCategory: null }).map((issue) => issue.field)).toEqual(["code", "name"])
    })

    it("varsayılan liste geçerli ve tekil; eksikler (tür + kod) hesaplanır", () => {
        for (const reason of DEFAULT_PRODUCTION_REASONS) expect(findReasonIssues(reason)).toEqual([])
        const keys = DEFAULT_PRODUCTION_REASONS.map((reason) => `${reason.kind}|${reason.code}`)
        expect(new Set(keys).size).toBe(keys.length)

        const missing = missingDefaultReasons([{ kind: "STOP", code: "D01" }, { kind: "SCRAP", code: "D02" }])
        expect(missing).toHaveLength(DEFAULT_PRODUCTION_REASONS.length - 1)
        expect(missing.find((reason) => reason.code === "D02" && reason.kind === "STOP")).toBeDefined()
    })
})
