import { describe, expect, it } from "vitest"

import type { AuditLogEntry } from "@/features/admin/auditLogs/api/types"
import { buildAuditChangeView } from "@/features/admin/auditLogs/utils/auditPresentation"

import {
    customerAuditFieldLabel,
    customerAuditItemLabel,
    customerAuditMetadataLines,
    customerAuditPresenter,
    customerAuditValueLabel,
} from "./customerAuditPresentation"

const entry = (overrides: Partial<AuditLogEntry> = {}): AuditLogEntry => ({
    id: "audit-1",
    entityType: "Customer",
    entityId: "customer-1",
    entityLabel: "Acme Plastik",
    action: "UPDATE",
    actor: { type: "USER", userId: "user-1", name: "Kubilay Uysal", email: "k@example.com", groups: ["admin"] },
    source: "PUT /customers/{id}",
    requestId: "req-1",
    ipAddress: "203.0.113.7",
    userAgent: "Mozilla/5.0",
    changes: [],
    metadata: null,
    createdAt: "2026-10-01T10:00:00.000Z",
    ...overrides,
})

describe("customerAuditFieldLabel", () => {
    it("müşteri alanlarını formdaki adıyla verir", () => {
        expect(customerAuditFieldLabel("companyName")).toBe("Firma adı")
        expect(customerAuditFieldLabel("assignedSalesUser")).toBe("Müşteri temsilcisi")
        expect(customerAuditFieldLabel("companyContacts")).toBe("Ceyhunlar iletişimleri")
    })

    it("adres alanını adres etiketiyle yazar; city İLÇE, state İL'dir", () => {
        expect(customerAuditFieldLabel("addresses.Merkez.line1")).toBe("Adres (Merkez) · Açık adres")
        expect(customerAuditFieldLabel("addresses.Merkez.city")).toBe("Adres (Merkez) · İlçe")
        expect(customerAuditFieldLabel("addresses.Merkez.state")).toBe("Adres (Merkez) · İl")
    })

    it("noktalı ya da tekrar eden etiketi bozmadan böler", () => {
        expect(customerAuditFieldLabel("addresses.Depo No.2.district")).toBe("Adres (Depo No.2) · Mahalle / bölge")
        expect(customerAuditFieldLabel("addresses.Merkez (2).roles")).toBe("Adres (Merkez (2)) · Adres türü")
    })

    it("bilinmeyen alanı olduğu gibi bırakır (kayıt yine okunur)", () => {
        expect(customerAuditFieldLabel("futureField")).toBe("futureField")
        expect(customerAuditFieldLabel("addresses.Merkez.futurePart")).toBe("Adres (Merkez) · futurePart")
    })
})

describe("customerAuditValueLabel / customerAuditItemLabel", () => {
    it("durum, iskonto, kredi limiti ve vadeyi okunur yazar", () => {
        expect(customerAuditValueLabel("status", "LEAD")).toBe("Potansiyel")
        expect(customerAuditValueLabel("status", "CUSTOMER")).toBe("Müşteri")
        expect(customerAuditValueLabel("generalDiscountPercent", "12.5")).toBe("%12,5")
        expect(customerAuditValueLabel("creditLimit", "250000")).toMatch(/250\.000/)
        expect(customerAuditValueLabel("defaultPaymentTermDays", "60")).toBe("60 gün")
        expect(customerAuditValueLabel("phone", "0555 111 22 33")).toBe("0555 111 22 33")
    })

    it("adres türü kodlarını Türkçe adla verir; diğer listeleri değiştirmez", () => {
        expect(customerAuditItemLabel("addresses.Merkez.roles", "BILLING")).toBe("Fatura")
        expect(customerAuditItemLabel("usageAreas", "Tutamak")).toBe("Tutamak")
    })

    it("genel gösterimle birlikte durum geçişini okunur verir", () => {
        expect(buildAuditChangeView({ field: "status", before: "LEAD", after: "CUSTOMER" }, customerAuditPresenter))
            .toEqual({ kind: "value", before: "Potansiyel", after: "Müşteri" })
    })
})

describe("customerAuditMetadataLines", () => {
    it("silmede kaskadla gidenleri yalnız varsa yazar", () => {
        expect(customerAuditMetadataLines(entry({
            action: "DELETE",
            metadata: { cascade: { visitCount: 2, assignedProductCount: 0, specialPriceCount: 1 } },
        }))).toEqual(["Kayıtla birlikte silinen: 2 ziyaret, 1 özel fiyat"])
        expect(customerAuditMetadataLines(entry({
            action: "DELETE",
            metadata: { cascade: { visitCount: 0, assignedProductCount: 0, specialPriceCount: 0 } },
        }))).toEqual([])
    })

    it("iş talebi onayını ve portal davetini belirtir", () => {
        expect(customerAuditMetadataLines(entry({ metadata: { businessRequestId: "br-1" } })))
            .toEqual(["Müşteri profil değişikliği talebinin onayıyla uygulandı"])
        expect(customerAuditMetadataLines(entry({ metadata: { invitationId: "inv-1", invitedByUserId: "u-2" } })))
            .toEqual(["Portal davetinin kabul edilmesiyle cari müşteriye dönüştü"])
    })

    it("metadata yoksa satır üretmez", () => {
        expect(customerAuditMetadataLines(entry())).toEqual([])
    })
})
