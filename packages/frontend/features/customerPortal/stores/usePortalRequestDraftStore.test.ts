import { describe, expect, it } from "vitest"
import { buildCurrencySummary, buildRequestItemPayload, getRequestFlowFlags, resolveCustomerPortalCartCta, resolveDraftPreviewImageUrl } from "../components/requestComposer/helpers"
import type { PortalRequestDraftItem } from "./usePortalRequestDraftStore"

const sampleItem: PortalRequestDraftItem = {
    productId: "p1",
    productSlug: "urun-1",
    productName: "Urun 1",
    productCode: "U1",
    variantId: "v1",
    variantKey: "D:10",
    variantFullCode: "U1.V1",
    quantity: 3,
    listUnitPrice: 100,
    customerUnitPrice: 80,
    appliedDiscountPercent: 20,
    currency: "TRY",
    productImageUrl: "https://example.com/a.webp",
}

describe("request composer helpers", () => {
    it("keeps backend payload free of preview-only image fields", () => {
        const payload = buildRequestItemPayload([{ ...sampleItem, quantity: 0.2 }])
        expect(payload[0]?.quantity).toBe(1)
        expect(payload[0]?.data).not.toHaveProperty("productImageUrl")
    })

    it("separates request flow flags", () => {
        expect(getRequestFlowFlags("CUSTOMER_ORDER_REQUEST")).toEqual({
            isOrderRequest: true,
            isPricingRequest: false,
            requiresDraftItems: true,
        })
        expect(getRequestFlowFlags("CUSTOMER_DOCUMENT_REQUEST")).toEqual({
            isOrderRequest: false,
            isPricingRequest: false,
            requiresDraftItems: false,
        })
    })

    it("summarizes mixed currencies without flattening totals", () => {
        const summary = buildCurrencySummary([
            sampleItem,
            { ...sampleItem, variantId: "v2", currency: "USD", customerUnitPrice: 10, listUnitPrice: 12 },
        ])
        expect(summary).toHaveLength(2)
        expect(summary.find((item) => item.currency === "TRY")?.customerTotal).toBe(240)
        expect(summary.find((item) => item.currency === "USD")?.customerTotal).toBe(30)
    })

    it("resolves route-aware cart actions", () => {
        expect(resolveCustomerPortalCartCta({ pathname: "/musteri/tum-urunler", hasItems: false })).toEqual({
            mode: "link",
            href: "/musteri/tum-urunler",
        })
        expect(resolveCustomerPortalCartCta({ pathname: "/musteri", hasItems: true })).toEqual({
            mode: "link",
            href: "/musteri/talepler/siparis-talebi",
        })
        expect(resolveCustomerPortalCartCta({ pathname: "/musteri/talepler/siparis-talebi", hasItems: true })).toEqual({
            mode: "scroll",
            href: null,
        })
    })

    it("falls back to placeholder when draft image is missing", () => {
        expect(resolveDraftPreviewImageUrl("")).toBe("/placeholder.webp")
        expect(resolveDraftPreviewImageUrl(undefined)).toBe("/placeholder.webp")
    })
})
