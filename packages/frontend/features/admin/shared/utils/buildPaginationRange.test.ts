import { describe, expect, it } from "vitest"

import { buildPaginationRange } from "./buildPaginationRange"

describe("buildPaginationRange", () => {
    it("az sayfada hepsini gösterir", () => {
        expect(buildPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5])
        expect(buildPaginationRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
    })

    it("başta yalnız sağda ellipsis kullanır", () => {
        expect(buildPaginationRange(1, 20)).toEqual([1, 2, "ellipsis", 20])
    })

    it("ortada iki tarafta da ellipsis kullanır", () => {
        expect(buildPaginationRange(10, 20)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20])
    })

    it("sonda yalnız solda ellipsis kullanır", () => {
        expect(buildPaginationRange(20, 20)).toEqual([1, "ellipsis", 19, 20])
    })

    it("ilk ve son sayfa her zaman görünür", () => {
        for (const page of [1, 5, 12, 30]) {
            const slots = buildPaginationRange(page, 30)
            expect(slots[0]).toBe(1)
            expect(slots[slots.length - 1]).toBe(30)
        }
    })

    it("aynı sayfa iki kez listelenmez", () => {
        const slots = buildPaginationRange(2, 20).filter((slot): slot is number => slot !== "ellipsis")
        expect(new Set(slots).size).toBe(slots.length)
    })

    it("aralık dışı sayfayı sınırlara çeker", () => {
        expect(buildPaginationRange(0, 5)).toEqual([1, 2, 3, 4, 5])
        expect(buildPaginationRange(99, 5)).toEqual([1, 2, 3, 4, 5])
    })

    it("geçersiz toplam sayfada boş döner", () => {
        expect(buildPaginationRange(1, 0)).toEqual([])
        expect(buildPaginationRange(1, Number.NaN)).toEqual([])
    })

    it("siblings genişletilebilir", () => {
        expect(buildPaginationRange(10, 20, 2)).toEqual([1, "ellipsis", 8, 9, 10, 11, 12, "ellipsis", 20])
    })
})
