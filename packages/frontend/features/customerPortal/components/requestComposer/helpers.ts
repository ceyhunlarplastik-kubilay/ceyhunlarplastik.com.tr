"use client"

import type { PortalBusinessRequestInput } from "@/features/businessRequests/api/types"
import type { PortalRequestDraftItem } from "@/features/customerPortal/stores/usePortalRequestDraftStore"

export function normalizeDraftQuantity(quantity: number) {
    if (!Number.isFinite(quantity)) return 1
    return Math.max(1, Math.min(100000, Math.round(quantity)))
}

export function buildRequestItemPayload(items: PortalRequestDraftItem[]): NonNullable<PortalBusinessRequestInput["items"]> {
    return items.map((item) => ({
        productVariantId: item.variantId,
        quantity: normalizeDraftQuantity(item.quantity),
        note: item.customerNote?.trim() || undefined,
        data: {
            productId: item.productId,
            productSlug: item.productSlug,
            productName: item.productName,
            productCode: item.productCode,
            variantName: item.variantName ?? null,
            variantKey: item.variantKey,
            variantFullCode: item.variantFullCode,
            listUnitPrice: item.listUnitPrice ?? null,
            customerUnitPrice: item.customerUnitPrice ?? null,
            appliedDiscountPercent: item.appliedDiscountPercent ?? null,
            targetUnitPrice: item.targetUnitPrice ?? null,
            currency: item.currency ?? "TRY",
        },
    }))
}

export function getRequestFlowFlags(
    requestType: PortalBusinessRequestInput["type"],
) {
    const isOrderRequest = requestType === "CUSTOMER_ORDER_REQUEST"
    const isPricingRequest = requestType === "CUSTOMER_PRICING_REQUEST"

    return {
        isOrderRequest,
        isPricingRequest,
        requiresDraftItems: isOrderRequest || isPricingRequest,
    }
}

export function buildCurrencySummary(items: PortalRequestDraftItem[]) {
    const summary = new Map<string, { currency: string; listTotal: number; customerTotal: number }>()

    items.forEach((item) => {
        const currency = item.currency ?? "TRY"
        const current = summary.get(currency) ?? {
            currency,
            listTotal: 0,
            customerTotal: 0,
        }
        const listUnitPrice = item.listUnitPrice ?? 0
        const customerUnitPrice = item.customerUnitPrice ?? item.listUnitPrice ?? 0

        current.listTotal += listUnitPrice * item.quantity
        current.customerTotal += customerUnitPrice * item.quantity
        summary.set(currency, current)
    })

    return Array.from(summary.values())
}

export function resolveCustomerPortalCartCta({
    pathname,
    hasItems,
}: {
    pathname: string
    hasItems: boolean
}) {
    if (!hasItems) {
        return {
            mode: "link" as const,
            href: "/musteri/tum-urunler",
        }
    }

    if (pathname === "/musteri/talepler/siparis-talebi") {
        return {
            mode: "scroll" as const,
            href: null,
        }
    }

    return {
        mode: "link" as const,
        href: "/musteri/talepler/siparis-talebi",
    }
}

export function resolveDraftPreviewImageUrl(url?: string | null) {
    return url?.trim() || "/placeholder.webp"
}
