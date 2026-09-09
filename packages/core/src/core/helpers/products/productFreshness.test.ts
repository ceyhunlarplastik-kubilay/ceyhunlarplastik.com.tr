import { describe, expect, it } from "vitest"

import {
    NEW_ITEM_WINDOW_DAYS,
    getNewItemCutoffDate,
    isWithinNewItemWindow,
} from "./productFreshness"

describe("getNewItemCutoffDate", () => {
    it("referans tarihten NEW_ITEM_WINDOW_DAYS kadar geriye gider", () => {
        const reference = new Date("2026-09-08T12:00:00.000Z")
        const cutoff = getNewItemCutoffDate(reference)

        const expectedMs = reference.getTime() - NEW_ITEM_WINDOW_DAYS * 24 * 60 * 60 * 1000
        expect(cutoff.getTime()).toBe(expectedMs)
    })
})

describe("isWithinNewItemWindow", () => {
    const reference = new Date("2026-09-08T12:00:00.000Z")

    it("tam pencere sınırındaki tarihi yeni sayar (gte, > değil)", () => {
        const cutoff = getNewItemCutoffDate(reference)
        expect(isWithinNewItemWindow(cutoff, reference)).toBe(true)
    })

    it("pencere içindeki (daha yeni) bir tarihi yeni sayar", () => {
        const yesterday = new Date(reference.getTime() - 24 * 60 * 60 * 1000)
        expect(isWithinNewItemWindow(yesterday, reference)).toBe(true)
    })

    it("pencere dışındaki (daha eski) bir tarihi yeni saymaz", () => {
        const cutoff = getNewItemCutoffDate(reference)
        const oneDayBeforeCutoff = new Date(cutoff.getTime() - 24 * 60 * 60 * 1000)
        expect(isWithinNewItemWindow(oneDayBeforeCutoff, reference)).toBe(false)
    })

    it("string tarihi de kabul eder", () => {
        expect(isWithinNewItemWindow(reference.toISOString(), reference)).toBe(true)
    })
})
