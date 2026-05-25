"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type PortalRequestDraftItem = {
    productId: string
    productSlug: string
    productName: string
    productCode: string
    variantId: string
    variantName?: string
    variantKey: string
    variantFullCode: string
    quantity: number
    listUnitPrice?: number | null
    customerUnitPrice?: number | null
    appliedDiscountPercent?: number | null
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

export const usePortalRequestDraftStore = create<PortalRequestDraftState>()(
    persist(
        (set) => ({
            items: [],
            addItem: (incoming) =>
                set((state) => {
                    const existingIndex = state.items.findIndex((item) => item.variantId === incoming.variantId)

                    if (existingIndex === -1) {
                        return {
                            items: [
                                ...state.items,
                                {
                                    ...incoming,
                                    quantity: clampQuantity(incoming.quantity),
                                    customerUnitPrice: incoming.customerUnitPrice ?? incoming.listUnitPrice ?? null,
                                    appliedDiscountPercent: incoming.appliedDiscountPercent ?? null,
                                    targetUnitPrice: incoming.targetUnitPrice ?? null,
                                    targetUnitPriceInput: incoming.targetUnitPriceInput ?? formatTargetUnitPriceInput(incoming.targetUnitPrice),
                                    customerNote: incoming.customerNote ?? "",
                                },
                            ],
                        }
                    }

                    const nextItems = [...state.items]
                    const existing = nextItems[existingIndex]
                    nextItems[existingIndex] = {
                        ...existing,
                        ...incoming,
                        quantity: clampQuantity(existing.quantity + incoming.quantity),
                        customerUnitPrice: incoming.customerUnitPrice ?? existing.customerUnitPrice ?? incoming.listUnitPrice ?? existing.listUnitPrice ?? null,
                        appliedDiscountPercent: incoming.appliedDiscountPercent ?? existing.appliedDiscountPercent ?? null,
                        targetUnitPrice: incoming.targetUnitPrice ?? existing.targetUnitPrice ?? null,
                        targetUnitPriceInput: incoming.targetUnitPriceInput
                            ?? existing.targetUnitPriceInput
                            ?? formatTargetUnitPriceInput(incoming.targetUnitPrice ?? existing.targetUnitPrice ?? null),
                        customerNote: incoming.customerNote ?? existing.customerNote ?? "",
                    }

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
                            ? { ...item, quantity: clampQuantity(quantity) }
                            : item,
                    ),
                })),
            updateItem: (variantId, patch) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.variantId === variantId
                            ? {
                                ...item,
                                ...patch,
                                quantity: patch.quantity !== undefined
                                    ? clampQuantity(patch.quantity)
                                    : item.quantity,
                                targetUnitPriceInput: patch.targetUnitPriceInput !== undefined
                                    ? patch.targetUnitPriceInput
                                    : item.targetUnitPriceInput,
                            }
                            : item,
                    ),
                })),
            clear: () => set({ items: [] }),
        }),
        {
            name: "customer-portal-request-draft-v3",
            storage: createJSONStorage(() => localStorage),
        },
    ),
)
