"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import {
    resolvePortalDraftPricing,
    type PortalDraftPriceSource,
    type PortalDraftSpecialPriceIneligibilityReason,
    type PortalDraftSpecialPricePreview,
} from "@/features/customerPortal/pricing/portalDraftPricing"

export type PortalRequestDraftItem = {
    productId: string
    productSlug: string
    productName: string
    productCode: string
    productImageUrl?: string | null
    variantId: string
    variantName?: string
    variantKey: string
    variantFullCode: string
    quantity: number
    listUnitPrice?: number | null
    customerUnitPrice?: number | null
    appliedDiscountPercent?: number | null
    generalDiscountPercent?: number | null
    priceSource?: PortalDraftPriceSource | null
    specialPriceId?: string | null
    specialPricePreview?: PortalDraftSpecialPricePreview | null
    specialPriceEligible?: boolean | null
    specialPriceIneligibilityReason?: PortalDraftSpecialPriceIneligibilityReason | null
    specialPriceIneligibilityMessage?: string | null
    pricingSnapshot?: Record<string, unknown> | null
    currency?: string | null
    targetUnitPrice?: number | null
    targetUnitPriceInput?: string
    customerNote?: string
}

type PortalRequestDraftState = {
    items: PortalRequestDraftItem[]
    addItem: (item: PortalRequestDraftItem) => void
    removeItem: (variantId: string) => void
    updateQuantity: (variantId: string, quantity: number) => void
    updateItem: (variantId: string, patch: Partial<PortalRequestDraftItem>) => void
    clear: () => void
}

function clampQuantity(quantity: number) {
    if (!Number.isFinite(quantity)) return 1
    return Math.max(1, Math.min(100000, Math.round(quantity)))
}

function formatTargetUnitPriceInput(targetUnitPrice?: number | null) {
    if (targetUnitPrice === null || targetUnitPrice === undefined || !Number.isFinite(targetUnitPrice)) return ""
    return String(targetUnitPrice)
}

function resolveItemPricing(item: PortalRequestDraftItem): PortalRequestDraftItem {
    const resolved = resolvePortalDraftPricing({
        quantity: item.quantity,
        listUnitPrice: item.listUnitPrice,
        currency: item.currency,
        generalDiscountPercent: item.generalDiscountPercent ?? item.appliedDiscountPercent ?? null,
        specialPrice: item.specialPricePreview ?? null,
    })

    return {
        ...item,
        listUnitPrice: resolved.listUnitPrice,
        customerUnitPrice: resolved.customerUnitPrice,
        appliedDiscountPercent: resolved.appliedDiscountPercent,
        currency: resolved.currency,
        priceSource: resolved.priceSource,
        specialPriceId: resolved.specialPriceId,
        specialPriceEligible: resolved.specialPriceEligible,
        specialPriceIneligibilityReason: resolved.specialPriceIneligibilityReason,
        specialPriceIneligibilityMessage: resolved.specialPriceIneligibilityMessage,
        pricingSnapshot: resolved.pricingSnapshot,
    }
}

export const usePortalRequestDraftStore = create<PortalRequestDraftState>()(
    persist(
        (set) => ({
            items: [],
            addItem: (incoming) =>
                set((state) => {
                    const existingIndex = state.items.findIndex((item) => item.variantId === incoming.variantId)

                    if (existingIndex === -1) {
                        const nextItem = resolveItemPricing({
                            ...incoming,
                            quantity: clampQuantity(incoming.quantity),
                            customerUnitPrice: incoming.customerUnitPrice ?? incoming.listUnitPrice ?? null,
                            appliedDiscountPercent: incoming.appliedDiscountPercent ?? null,
                            generalDiscountPercent: incoming.generalDiscountPercent ?? incoming.appliedDiscountPercent ?? null,
                            priceSource: incoming.priceSource ?? null,
                            specialPriceId: incoming.specialPriceId ?? null,
                            specialPricePreview: incoming.specialPricePreview ?? null,
                            specialPriceEligible: incoming.specialPriceEligible ?? null,
                            specialPriceIneligibilityReason: incoming.specialPriceIneligibilityReason ?? null,
                            specialPriceIneligibilityMessage: incoming.specialPriceIneligibilityMessage ?? null,
                            pricingSnapshot: incoming.pricingSnapshot ?? null,
                            targetUnitPrice: incoming.targetUnitPrice ?? null,
                            targetUnitPriceInput: incoming.targetUnitPriceInput ?? formatTargetUnitPriceInput(incoming.targetUnitPrice),
                            customerNote: incoming.customerNote ?? "",
                        })

                        return {
                            items: [
                                ...state.items,
                                nextItem,
                            ],
                        }
                    }

                    const nextItems = [...state.items]
                    const existing = nextItems[existingIndex]
                    nextItems[existingIndex] = resolveItemPricing({
                        ...existing,
                        ...incoming,
                        quantity: clampQuantity(existing.quantity + incoming.quantity),
                        customerUnitPrice: incoming.customerUnitPrice ?? existing.customerUnitPrice ?? incoming.listUnitPrice ?? existing.listUnitPrice ?? null,
                        appliedDiscountPercent: incoming.appliedDiscountPercent ?? existing.appliedDiscountPercent ?? null,
                        generalDiscountPercent: incoming.generalDiscountPercent ?? existing.generalDiscountPercent ?? null,
                        priceSource: incoming.priceSource ?? existing.priceSource ?? null,
                        specialPriceId: incoming.specialPriceId ?? existing.specialPriceId ?? null,
                        specialPricePreview: incoming.specialPricePreview ?? existing.specialPricePreview ?? null,
                        specialPriceEligible: incoming.specialPriceEligible ?? existing.specialPriceEligible ?? null,
                        specialPriceIneligibilityReason: incoming.specialPriceIneligibilityReason ?? existing.specialPriceIneligibilityReason ?? null,
                        specialPriceIneligibilityMessage: incoming.specialPriceIneligibilityMessage ?? existing.specialPriceIneligibilityMessage ?? null,
                        pricingSnapshot: incoming.pricingSnapshot ?? existing.pricingSnapshot ?? null,
                        targetUnitPrice: incoming.targetUnitPrice ?? existing.targetUnitPrice ?? null,
                        targetUnitPriceInput: incoming.targetUnitPriceInput
                            ?? existing.targetUnitPriceInput
                            ?? formatTargetUnitPriceInput(incoming.targetUnitPrice ?? existing.targetUnitPrice ?? null),
                        customerNote: incoming.customerNote ?? existing.customerNote ?? "",
                    })

                    return { items: nextItems }
                }),
            removeItem: (variantId) =>
                set((state) => ({
                    items: state.items.filter((item) => item.variantId !== variantId),
                })),
            updateQuantity: (variantId, quantity) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.variantId === variantId
                            ? resolveItemPricing({ ...item, quantity: clampQuantity(quantity) })
                            : item,
                    ),
                })),
            updateItem: (variantId, patch) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.variantId === variantId
                            ? resolveItemPricing({
                                ...item,
                                ...patch,
                                quantity: patch.quantity !== undefined
                                    ? clampQuantity(patch.quantity)
                                    : item.quantity,
                                targetUnitPriceInput: patch.targetUnitPriceInput !== undefined
                                    ? patch.targetUnitPriceInput
                                    : item.targetUnitPriceInput,
                            })
                            : item,
                    ),
                })),
            clear: () => set({ items: [] }),
        }),
        {
            name: "customer-portal-request-draft-v4",
            storage: createJSONStorage(() => localStorage),
        },
    ),
)
