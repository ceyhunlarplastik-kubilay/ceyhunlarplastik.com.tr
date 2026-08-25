import { describe, expect, it } from "vitest"

import { buildVariantTableMeta } from "./buildVariantTableMeta"

describe("buildVariantTableMeta", () => {
    it("toplam sayfayı yukarı yuvarlar", () => {
        expect(buildVariantTableMeta({ page: 1, limit: 100, total: 101, columns: [] }).totalPages).toBe(2)
    })

    it("kayıt yoksa sıfır sayfa döner", () => {
        expect(buildVariantTableMeta({ page: 1, limit: 100, total: 0, columns: [] }).totalPages).toBe(0)
    })

    it("limit 0 ise bölme yapmaz", () => {
        // Savunma amaçlı: limit normalize edilerek geliyor ama Infinity/NaN
        // sızarsa sayfalama arayüzü bozulurdu.
        expect(buildVariantTableMeta({ page: 1, limit: 0, total: 10, columns: [] }).totalPages).toBe(0)
    })

    it("kolonları olduğu gibi taşır — sayfadan türetmez", () => {
        // Kolonlar ürünün ölçü şablonundan geliyor; bu yardımcı onlara dokunmaz.
        const meta = buildVariantTableMeta({ page: 2, limit: 50, total: 120, columns: ["R", "H1", "D"] })
        expect(meta.columns).toEqual(["R", "H1", "D"])
        expect(meta).toMatchObject({ page: 2, limit: 50, total: 120, totalPages: 3 })
    })
})
