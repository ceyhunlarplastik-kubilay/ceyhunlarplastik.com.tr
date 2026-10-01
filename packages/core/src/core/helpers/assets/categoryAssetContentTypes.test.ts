import { describe, expect, it } from "vitest"

import {
    ALL_CATEGORY_ASSET_CONTENT_TYPES,
    isAllowedCategoryAssetContentType,
} from "./categoryAssetContentTypes"

describe("isAllowedCategoryAssetContentType", () => {
    it("asset tipine uyan içerik tipini kabul eder", () => {
        expect(isAllowedCategoryAssetContentType("IMAGE", "image/png")).toBe(true)
        expect(isAllowedCategoryAssetContentType("VIDEO", "video/mp4")).toBe(true)
        expect(isAllowedCategoryAssetContentType("PDF", "application/pdf")).toBe(true)
    })

    it("tip ile içerik uyuşmazsa reddeder", () => {
        expect(isAllowedCategoryAssetContentType("IMAGE", "application/pdf")).toBe(false)
        expect(isAllowedCategoryAssetContentType("PDF", "image/png")).toBe(false)
    })

    it("CDN'den çalıştırılabilecek tipleri hiçbir asset tipinde kabul etmez", () => {
        for (const type of ["text/html", "image/svg+xml", "application/javascript", "text/xml"]) {
            expect(ALL_CATEGORY_ASSET_CONTENT_TYPES).not.toContain(type)
            expect(isAllowedCategoryAssetContentType("IMAGE", type)).toBe(false)
        }
    })

    it("bilinmeyen asset tipini reddeder", () => {
        expect(isAllowedCategoryAssetContentType("UNKNOWN", "image/png")).toBe(false)
    })
})
