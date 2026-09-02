import { describe, expect, it } from "vitest"

import {
    getVisibleSelectionState,
    resolveSelectedNames,
    toggleSelectionId,
    toggleVisibleSelection,
} from "./bulkSelection"

describe("toggleSelectionId", () => {
    it("seçili değilse ekler", () => {
        expect([...toggleSelectionId(new Set(["a"]), "b")]).toEqual(["a", "b"])
    })

    it("seçiliyse çıkarır", () => {
        expect([...toggleSelectionId(new Set(["a", "b"]), "b")]).toEqual(["a"])
    })

    it("girdi Set'ini mutasyona uğratmaz", () => {
        const input = new Set(["a"])
        toggleSelectionId(input, "b")
        expect([...input]).toEqual(["a"])
    })
})

describe("toggleVisibleSelection", () => {
    it("hiçbiri seçili değilken hepsini seçer", () => {
        expect([...toggleVisibleSelection(new Set(), ["a", "b"])]).toEqual(["a", "b"])
    })

    it("hepsi seçiliyken görünenleri bırakır, diğer sayfa seçimini korur", () => {
        const result = toggleVisibleSelection(new Set(["a", "b", "z"]), ["a", "b"])
        expect([...result]).toEqual(["z"])
    })

    it("bir kısmı seçiliyken kalanları da seçer", () => {
        expect([...toggleVisibleSelection(new Set(["a"]), ["a", "b", "c"])]).toEqual(["a", "b", "c"])
    })

    it("görünen liste boşsa seçimi değiştirmez", () => {
        expect([...toggleVisibleSelection(new Set(["a"]), [])]).toEqual(["a"])
    })
})

describe("getVisibleSelectionState", () => {
    it("boş görünen liste → none", () => {
        expect(getVisibleSelectionState(new Set(["a"]), [])).toBe("none")
    })

    it("hiçbiri → none", () => {
        expect(getVisibleSelectionState(new Set(["z"]), ["a", "b"])).toBe("none")
    })

    it("bir kısmı → some", () => {
        expect(getVisibleSelectionState(new Set(["a"]), ["a", "b"])).toBe("some")
    })

    it("hepsi → all", () => {
        expect(getVisibleSelectionState(new Set(["a", "b"]), ["a", "b"])).toBe("all")
    })
})

describe("resolveSelectedNames", () => {
    it("bilinen id'ler ada, bilinmeyenler id'ye düşer", () => {
        const names = new Map([["a", "Acme"], ["b", "Beta"]])
        expect(resolveSelectedNames(new Set(["a", "b", "c"]), names)).toEqual(["Acme", "Beta", "c"])
    })
})
