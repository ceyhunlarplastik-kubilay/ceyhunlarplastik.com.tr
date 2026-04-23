"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type InquiryCartItem = {
    productId: string
    productSlug: string
    productName: string
    productCode: string
    variantKey: string
    variantId?: string
    variantFullCode?: string | null
    quantity: number
}

type InquiryCartState = {
    items: InquiryCartItem[]
    addItem: (item: InquiryCartItem) => void
    removeItem: (productId: string, variantKey: string, variantId?: string) => void
    clear: () => void
}

function itemKey(item: Pick<InquiryCartItem, "productId" | "variantKey" | "variantId">) {
    return `${item.productId}:${item.variantKey}:${item.variantId ?? ""}`
}

export const useInquiryCartStore = create<InquiryCartState>()(
    persist(
        (set) => ({
            items: [],
            addItem: (incoming) =>
                set((state) => {
                    const key = itemKey(incoming)
                    const existingIndex = state.items.findIndex((item) => itemKey(item) === key)

                    if (existingIndex === -1) {
                        return {
                            items: [...state.items, incoming],
                        }
                    }

                    const nextItems = [...state.items]
                    const existing = nextItems[existingIndex]
                    nextItems[existingIndex] = {
                        ...existing,
                        quantity: existing.quantity + incoming.quantity,
                    }

                    return { items: nextItems }
                }),
            removeItem: (productId, variantKey, variantId) =>
                set((state) => ({
                    items: state.items.filter(
                        (item) => itemKey(item) !== itemKey({ productId, variantKey, variantId })
                    ),
                })),
            clear: () => set({ items: [] }),
        }),
        {
            name: "inquiry-cart-v1",
            storage: createJSONStorage(() => localStorage),
        }
    )
)

