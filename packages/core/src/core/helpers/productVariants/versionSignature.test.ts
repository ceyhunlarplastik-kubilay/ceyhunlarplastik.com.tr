import { describe, expect, it } from "vitest"

import {
    buildVersionSignature,
    buildVersionSignatureFromEntities,
    compareVersionKeys,
    type VersionKeyInput,
} from "./versionSignature"

const black = { id: "color-black", system: "RAL", code: "9005" }
const white = { id: "color-white", system: "RAL", code: "9010" }
const polypropylene = { id: "mat-pp", code: "PP", name: "Polipropilen" }
const polyethylene = { id: "mat-pe", code: "PE", name: "Polietilen" }

function withSignature(input: VersionKeyInput) {
    return { ...input, signature: buildVersionSignatureFromEntities(input) }
}

describe("buildVersionSignature", () => {
    it("renk ve hammadde kümesini kanonik metne çevirir", () => {
        expect(buildVersionSignature({ colorId: "color-black", materialIds: ["mat-pp"] }))
            .toBe("color:color-black|materials:mat-pp")
    })

    it("hammadde sırasından bağımsızdır", () => {
        const first = buildVersionSignature({ colorId: "c", materialIds: ["mat-pp", "mat-pe"] })
        const second = buildVersionSignature({ colorId: "c", materialIds: ["mat-pe", "mat-pp"] })
        expect(first).toBe(second)
    })

    it("tekrar eden hammaddeyi tekilleştirir", () => {
        expect(buildVersionSignature({ colorId: "c", materialIds: ["mat-pp", "mat-pp"] }))
            .toBe(buildVersionSignature({ colorId: "c", materialIds: ["mat-pp"] }))
    })

    it("renksiz versiyonu renkliden ayırır", () => {
        expect(buildVersionSignature({ colorId: null, materialIds: ["mat-pp"] }))
            .not.toBe(buildVersionSignature({ colorId: "color-black", materialIds: ["mat-pp"] }))
    })
})

describe("compareVersionKeys", () => {
    it("renksizleri en başa alır", () => {
        const ordered = [
            withSignature({ color: black, materials: [polypropylene] }),
            withSignature({ color: null, materials: [polypropylene] }),
        ].sort(compareVersionKeys)

        expect(ordered[0].color).toBeNull()
    })

    it("renk kodunu sayısal sıralar", () => {
        const ordered = [
            withSignature({ color: { id: "c-100", system: "RAL", code: "9010" }, materials: [] }),
            withSignature({ color: { id: "c-20", system: "RAL", code: "1013" }, materials: [] }),
        ].sort(compareVersionKeys)

        expect(ordered.map((entry) => entry.color?.code)).toEqual(["1013", "9010"])
    })

    it("aynı renkte hammadde koduna göre sıralar", () => {
        const ordered = [
            withSignature({ color: black, materials: [polypropylene] }),
            withSignature({ color: black, materials: [polyethylene] }),
        ].sort(compareVersionKeys)

        expect(ordered.map((entry) => entry.materials[0].code)).toEqual(["PE", "PP"])
    })

    it("hammadde kodu yoksa ada düşer", () => {
        const ordered = [
            withSignature({ color: black, materials: [{ id: "m-2", code: null, name: "Zamak" }] }),
            withSignature({ color: black, materials: [{ id: "m-1", code: null, name: "Alüminyum" }] }),
        ].sort(compareVersionKeys)

        expect(ordered.map((entry) => entry.materials[0].name)).toEqual(["Alüminyum", "Zamak"])
    })

    it("her şey eşitse imzayla kararlı ayrım yapar", () => {
        const left = withSignature({ color: black, materials: [polypropylene] })
        const right = { ...left, signature: "color:color-black|materials:mat-zz" }
        expect(compareVersionKeys(left, right)).toBeLessThan(0)
        expect(compareVersionKeys(left, left)).toBe(0)
    })
})
