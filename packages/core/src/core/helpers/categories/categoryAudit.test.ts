import { describe, expect, it } from "vitest"

import { diffAuditSnapshots } from "@/core/helpers/audit/auditDiff"

import { categoryAuditLabel, toCategoryAuditSnapshot } from "./categoryAudit"

const category = {
    code: 10,
    name: "Bakalit Tutamak",
    slug: "bakalit-tutamak",
    allowedAttributeValueIds: ["value-b", "value-a"],
    translations: [
        { locale: "tr", name: "Bakalit Tutamak", slug: "bakalit-tutamak" },
        { locale: "en", name: "Bakelite Handle", slug: "bakelite-handle" },
    ],
}

describe("toCategoryAuditSnapshot", () => {
    it("denetlenen alanları düz alan yollarıyla verir; TR çevirisi legacy kolonların aynasıyken yazılmaz", () => {
        expect(toCategoryAuditSnapshot(category)).toEqual({
            code: 10,
            name: "Bakalit Tutamak",
            slug: "bakalit-tutamak",
            allowedAttributeValueIds: ["value-a", "value-b"],
            "translations.en.name": "Bakelite Handle",
            "translations.en.slug": "bakelite-handle",
        })
    })

    it("TR çevirisi legacy kolonlardan ayrışırsa ayrışan alanı gösterir", () => {
        const snapshot = toCategoryAuditSnapshot({
            ...category,
            translations: [{ locale: "tr", name: "Bakalit Kulp", slug: "bakalit-tutamak" }],
        })

        expect(snapshot["translations.tr.name"]).toBe("Bakalit Kulp")
        expect(snapshot).not.toHaveProperty("translations.tr.slug")
    })

    it("izinli değerlerin sırası fark üretmez; girdi dizisini değiştirmez", () => {
        const reordered = { ...category, allowedAttributeValueIds: ["value-a", "value-b"] }

        expect(diffAuditSnapshots(toCategoryAuditSnapshot(category), toCategoryAuditSnapshot(reordered))).toEqual([])
        expect(category.allowedAttributeValueIds).toEqual(["value-b", "value-a"])
    })

    it("çeviri yüklenmemiş satırı da kabul eder", () => {
        const { translations: _translations, ...withoutTranslations } = category

        expect(toCategoryAuditSnapshot(withoutTranslations)).toEqual({
            code: 10,
            name: "Bakalit Tutamak",
            slug: "bakalit-tutamak",
            allowedAttributeValueIds: ["value-a", "value-b"],
        })
    })

    it("TR ad değişikliği listede bir kez görünür (ad + slug), çeviri satırı tekrar etmez", () => {
        const renamed = {
            ...category,
            name: "Bakalit Tutamaklar",
            slug: "bakalit-tutamaklar",
            translations: [
                { locale: "tr", name: "Bakalit Tutamaklar", slug: "bakalit-tutamaklar" },
                { locale: "en", name: "Bakelite Handle", slug: "bakelite-handle" },
            ],
        }

        expect(diffAuditSnapshots(toCategoryAuditSnapshot(category), toCategoryAuditSnapshot(renamed))).toEqual([
            { field: "name", before: "Bakalit Tutamak", after: "Bakalit Tutamaklar" },
            { field: "slug", before: "bakalit-tutamak", after: "bakalit-tutamaklar" },
        ])
    })

    it("çeviri ekleme ve silme dil başına ayrı alanlar olarak görünür", () => {
        const next = {
            ...category,
            translations: [
                { locale: "tr", name: "Bakalit Tutamak", slug: "bakalit-tutamak" },
                { locale: "de", name: "Bakelitgriff", slug: "bakelitgriff" },
            ],
        }

        expect(diffAuditSnapshots(toCategoryAuditSnapshot(category), toCategoryAuditSnapshot(next))).toEqual([
            { field: "translations.en.name", before: "Bakelite Handle", after: null },
            { field: "translations.en.slug", before: "bakelite-handle", after: null },
            { field: "translations.de.name", before: null, after: "Bakelitgriff" },
            { field: "translations.de.slug", before: null, after: "bakelitgriff" },
        ])
    })
})

describe("categoryAuditLabel", () => {
    it("kod ve adı birleştirir", () => {
        expect(categoryAuditLabel(category)).toBe("10 · Bakalit Tutamak")
    })
})
