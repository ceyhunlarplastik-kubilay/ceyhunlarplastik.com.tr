import { describe, expect, it } from "vitest"

import {
    applyVariantSupplierMarginVisibility,
    canManageVariantSupplierMargins,
    stripVariantSupplierMargins,
    VARIANT_SUPPLIER_MARGIN_FIELDS,
} from "./supplierFieldVisibility"

const supplierRow = {
    id: "vs-1",
    supplierCode: "A",
    fullCode: "10.5.1.V1.A",
    price: 120,
    operationalCostRate: 10,
    netCost: 132,
    profitRate: 25,
    listPrice: 165,
    minOrderQty: 500,
    unitsPerPackage: 100,
    minLeadTimeDays: 14,
    hasSupplierLogo: true,
}

describe("canManageVariantSupplierMargins", () => {
    it("owner, admin ve satın alma marj alanlarını yönetebilir", () => {
        expect(canManageVariantSupplierMargins({ isOwner: true })).toBe(true)
        expect(canManageVariantSupplierMargins({ isAdmin: true })).toBe(true)
        expect(canManageVariantSupplierMargins({ isPurchasing: true })).toBe(true)
    })

    it("veri girişi operatörü YÖNETEMEZ", () => {
        expect(canManageVariantSupplierMargins({ isContentEditor: true })).toBe(false)
    })

    it("kullanıcı yoksa reddeder", () => {
        expect(canManageVariantSupplierMargins(undefined)).toBe(false)
        expect(canManageVariantSupplierMargins(null)).toBe(false)
        expect(canManageVariantSupplierMargins({})).toBe(false)
    })
})

describe("stripVariantSupplierMargins", () => {
    it("yalnız marj alanlarını çıkarır, katalog alanlarına dokunmaz", () => {
        const stripped = stripVariantSupplierMargins(supplierRow)

        for (const field of VARIANT_SUPPLIER_MARGIN_FIELDS) {
            expect(stripped).not.toHaveProperty(field)
        }
        // `price` tedarikçinin BİZE fiyatı — operatör bunu girer, kalmalı.
        expect(stripped.price).toBe(120)
        expect(stripped.minOrderQty).toBe(500)
        expect(stripped.unitsPerPackage).toBe(100)
        expect(stripped.minLeadTimeDays).toBe(14)
        expect(stripped.hasSupplierLogo).toBe(true)
        expect(stripped.fullCode).toBe("10.5.1.V1.A")
    })

    it("girdiyi mutasyona uğratmaz", () => {
        stripVariantSupplierMargins(supplierRow)
        expect(supplierRow.listPrice).toBe(165)
    })
})

describe("applyVariantSupplierMarginVisibility", () => {
    it("yetkili kullanıcıda satırı olduğu gibi bırakır", () => {
        const row = applyVariantSupplierMarginVisibility(supplierRow, { isAdmin: true })
        expect(row).toHaveProperty("listPrice", 165)
    })

    it("operatörde marj alanlarını gizler", () => {
        const row = applyVariantSupplierMarginVisibility(supplierRow, { isContentEditor: true })
        expect(row).not.toHaveProperty("listPrice")
        expect(row).not.toHaveProperty("profitRate")
        expect(row).toHaveProperty("price", 120)
    })
})
