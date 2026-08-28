"use client"

import { create } from "zustand"

/**
 * Sepet drawer'ının aç/kapa sinyali. Kalemler `usePortalRequestDraftStore`'da
 * yaşar (persist edilir); bu store SADECE UI durumu taşır ve BİLEREK persist
 * edilmez — sayfa yenilendiğinde drawer'ın açık kalması istenmez.
 */
type CartDrawerState = {
    isOpen: boolean
    open: () => void
    close: () => void
    setOpen: (isOpen: boolean) => void
}

export const useCartDrawerStore = create<CartDrawerState>()((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    setOpen: (isOpen) => set({ isOpen }),
}))
