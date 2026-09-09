"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, ShoppingCart } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { CartShortcutKbd } from "@/features/customerPortal/components/CartShortcutKbd"
import { resolveCustomerPortalCartCta } from "@/features/customerPortal/components/requestComposer/helpers"
import { usePortalRequestDraftStore } from "@/features/customerPortal/stores/usePortalRequestDraftStore"
import { useCartDrawerStore } from "@/features/customerPortal/stores/useCartDrawerStore"
import { cn } from "@/lib/utils"

type Props = {
    mode: "topbar" | "mobile-sticky"
}

export function CustomerPortalCartDock({ mode }: Props) {
    const pathname = usePathname()
    const shouldReduceMotion = useReducedMotion()
    const items = usePortalRequestDraftStore((state) => state.items)
    const openCartDrawer = useCartDrawerStore((state) => state.open)
    const hasItems = items.length > 0
    const cta = resolveCustomerPortalCartCta({ pathname, hasItems })

    function handleOrderPageScroll() {
        if (cta.mode !== "scroll") return
        const panel = document.getElementById("customer-order-draft-panel")
        panel?.scrollIntoView({
            behavior: shouldReduceMotion ? "auto" : "smooth",
            block: "start",
        })
        panel?.focus?.()
    }

    // Sade: yalnız sepet ikonu (+ eklenen varyant ÇEŞİDİ sayısı rozeti — miktar
    // toplamı değil, `items.length`) ve klavye kısayolu görünür. Görünür metin
    // kalmadığı için erişilebilir ad `aria-label` üzerinden veriliyor.
    const accessibleLabel = hasItems
        ? `Sipariş sepeti, ${items.length} ürün çeşidi`
        : "Hazır sepet"

    const card = (
        <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={shouldReduceMotion ? undefined : { y: -2 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
            className={cn(
                "group overflow-hidden border backdrop-blur-xl transition",
                mode === "topbar"
                    ? "rounded-[22px] px-4 py-3 shadow-sm"
                    : "rounded-3xl px-4 py-3 shadow-xl",
                hasItems
                    ? "border-brand/30 bg-brand/10 text-neutral-950"
                    : "border-neutral-200 bg-white/95 text-neutral-900",
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="relative inline-flex shrink-0">
                    <div className={cn(
                        "inline-flex size-11 items-center justify-center rounded-2xl",
                        hasItems ? "bg-brand/15 text-brand" : "bg-brand/10 text-brand",
                    )}>
                        <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                    </div>

                    {hasItems ? (
                        <span
                            className="absolute -top-1 -inset-e-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white"
                            aria-hidden="true"
                        >
                            {items.length}
                        </span>
                    ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    {hasItems && mode === "topbar" ? (
                        <CartShortcutKbd className="hidden [&>kbd]:bg-brand/10 [&>kbd]:text-brand lg:flex" />
                    ) : null}

                    <ArrowRight
                        className="h-4 w-4 shrink-0 text-neutral-500 transition group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                        aria-hidden="true"
                    />
                </div>
            </div>
        </motion.div>
    )

    const wrapperClassName = cn(
        "block w-full text-left",
        mode === "mobile-sticky" && "mx-auto max-w-[124rem]",
    )

    return (
        <div
            className={cn(
                mode === "topbar"
                    ? "hidden md:block"
                    : "fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-4 pb-[calc(0.9rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-14px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden",
            )}
        >
            {cta.mode === "link" ? (
                hasItems ? (
                    <button type="button" onClick={openCartDrawer} className={wrapperClassName} aria-label={accessibleLabel}>
                        {card}
                    </button>
                ) : (
                    <Link href={cta.href} className={wrapperClassName} aria-label={accessibleLabel}>
                        {card}
                    </Link>
                )
            ) : (
                <button type="button" onClick={handleOrderPageScroll} className={wrapperClassName} aria-label={accessibleLabel}>
                    {card}
                </button>
            )}
        </div>
    )
}
