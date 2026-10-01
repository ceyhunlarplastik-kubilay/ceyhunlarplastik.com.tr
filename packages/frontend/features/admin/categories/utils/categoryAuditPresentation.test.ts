import { describe, expect, it } from "vitest"

import type { AuditLogEntry } from "@/features/admin/auditLogs/api/types"
import type { ProductAttribute } from "@/features/admin/productAttributes/api/listAttributesWithValues"

import {
    buildCategoryAuditPresenter,
    categoryAuditFieldLabel,
    categoryAuditMetadataLines,
} from "./categoryAuditPresentation"

const attributes: ProductAttribute[] = [
    {
        id: "attribute-1",
        code: "model_type",
        name: "Model Tipi",
        displayOrder: 0,
        values: [
            { id: "value-a", name: "Düz", slug: "duz" },
            { id: "value-b", name: "Kavisli", slug: "kavisli" },
        ],
    },
]

const entry = (overrides: Partial<AuditLogEntry> = {}): AuditLogEntry => ({
    id: "audit-1",
    entityType: "Category",
    entityId: "category-1",
    entityLabel: "10 · Bakalit Tutamaklar",
    action: "UPDATE",
    actor: { type: "USER", userId: "user-1", name: "Kubilay Uysal", email: "k@example.com", groups: ["admin"] },
    source: "PUT /categories/{id}",
    requestId: "req-1",
    ipAddress: "203.0.113.7",
    userAgent: "Mozilla/5.0",
    changes: [],
    metadata: null,
    createdAt: "2026-09-30T10:00:00.000Z",
    ...overrides,
})

describe("categoryAuditFieldLabel", () => {
    it("kategori alanlarını okunur adla verir", () => {
        expect(categoryAuditFieldLabel("code")).toBe("Kod")
        expect(categoryAuditFieldLabel("name")).toBe("Ad (Türkçe)")
        expect(categoryAuditFieldLabel("slug")).toBe("Slug (Türkçe)")
        expect(categoryAuditFieldLabel("allowedAttributeValueIds")).toBe("İzinli attribute değerleri")
    })

    it("çeviri alan yolunu dil adıyla yazar", () => {
        expect(categoryAuditFieldLabel("translations.en.name")).toBe("Ad (İngilizce)")
        expect(categoryAuditFieldLabel("translations.de.slug")).toBe("Slug (Almanca)")
    })

    it("bilinmeyen dil ve alanı olduğu gibi bırakır (kayıt yine okunur)", () => {
        expect(categoryAuditFieldLabel("translations.xx.name")).toBe("Ad (xx)")
        expect(categoryAuditFieldLabel("futureField")).toBe("futureField")
    })
})

describe("categoryAuditMetadataLines", () => {
    it("silmede kaskadla gidenleri yazar", () => {
        expect(categoryAuditMetadataLines(entry({
            action: "DELETE",
            metadata: { cascade: { productCount: 4, assetKeys: ["a.png", "b.png"] } },
        }))).toEqual(["Kategoriyle birlikte silinen: 4 ürün, 2 görsel"])
    })

    it("tedarikçi talebiyle oluşan kategoriyi belirtir", () => {
        expect(categoryAuditMetadataLines(entry({
            action: "CREATE",
            metadata: { businessRequestId: "request-1", businessRequestType: "SUPPLIER_CATEGORY_CREATE" },
        }))).toEqual(["Tedarikçi talebinin onayıyla oluşturuldu"])
    })

    it("bağlam yoksa ya da beklenmeyen şekildeyse satır üretmez", () => {
        expect(categoryAuditMetadataLines(entry())).toEqual([])
        expect(categoryAuditMetadataLines(entry({ action: "DELETE", metadata: { cascade: "x" } })))
            .toEqual(["Kategoriyle birlikte silinen: 0 ürün, 0 görsel"])
    })
})

describe("buildCategoryAuditPresenter", () => {
    it("izinli değer id'lerini attribute + değer adına çevirir", () => {
        const presenter = buildCategoryAuditPresenter(attributes)

        expect(presenter.itemLabel?.("allowedAttributeValueIds", "value-a")).toBe("Model Tipi: Düz")
    })

    it("sözlükte olmayan id'yi silinmiş değer olarak gösterir", () => {
        const presenter = buildCategoryAuditPresenter(attributes)

        expect(presenter.itemLabel?.("allowedAttributeValueIds", "3f2b8c1e-5a4d-4e6f-9a1b-2c3d4e5f6a7b"))
            .toBe("Silinmiş değer (3f2b8c1e)")
    })

    it("sözlük yüklenirken id'leri silinmiş diye göstermez", () => {
        const presenter = buildCategoryAuditPresenter(undefined)

        expect(presenter.itemLabel?.("allowedAttributeValueIds", "value-a")).toBe("…")
    })

    it("başka alanların öğelerine dokunmaz", () => {
        const presenter = buildCategoryAuditPresenter(attributes)

        expect(presenter.itemLabel?.("tags", "value-a")).toBe("value-a")
    })
})
