"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react"
import { usePortalRequestDraftStore } from "@/features/customerPortal/stores/usePortalRequestDraftStore"
import { buildCurrencySummary, resolveCustomerPortalCartCta } from "@/features/customerPortal/components/requestComposer/helpers"
import { formatMoney } from "@/lib/customers/pricing"
import { cn } from "@/lib/utils"

type Props = {
    mode: "topbar" | "mobile-sticky"
}

export function CustomerPortalCartDock({ mode }: Props) {
    const pathname = usePathname()
    const items = usePortalRequestDraftStore((state) => state.items)
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const hasItems = items.length > 0
    const currencySummary = buildCurrencySummary(items)
    const cta = resolveCustomerPortalCartCta({
        pathname,
        hasItems,
    })

    function handleOrderPageScroll() {
        if (cta.mode !== "scroll") return
        const panel = document.getElementById("customer-order-draft-panel")
        panel?.scrollIntoView({ behavior: "smooth", block: "start" })
        panel?.focus?.()
    }

    const totalLabel = currencySummary.length === 1
        ? formatMoney(currencySummary[0].customerTotal, currencySummary[0].currency)
        : currencySummary.length > 1
            ? "Coklu para birimi"
            : null

    return (
        <div
            className={cn(
                mode === "topbar"
                    ? "hidden md:block"
                    : "fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-4 pb-[calc(0.9rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-14px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden",
            )}
        >
            {cta.mode === "link" ? (
                <Link
                    href={cta.href}
                    className={cn(
                        "block",
                        mode === "mobile-sticky" && "mx-auto w-full max-w-[124rem]",
                    )}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        className={cn(
                            "group overflow-hidden border backdrop-blur-xl transition",
                            mode === "topbar"
                                ? "rounded-[22px] px-4 py-3 shadow-sm"
                                : "rounded-[24px] px-4 py-3 shadow-xl",
                            hasItems
                                ? "border-brand/30 bg-brand text-white"
                                : "border-neutral-200 bg-white/95 text-neutral-900",
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={hasItems ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                                transition={hasItems ? { duration: 1.8, repeat: Infinity } : { duration: 0.2 }}
                                className={cn(
                                    "inline-flex size-11 items-center justify-center rounded-2xl",
                                    hasItems ? "bg-white/16" : "bg-brand/10 text-brand",
                                )}
                            >
                                <ShoppingBag className="h-5 w-5" />
                            </motion.div>

                            <div className="min-w-0 flex-1">
                                <div className={cn(
                                    "text-[11px] font-medium uppercase tracking-[0.22em]",
                                    hasItems ? "text-white/72" : "text-neutral-500",
                                )}>
                                    {hasItems ? "Siparis Sepeti" : "Hazir Sepet"}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2">
                                    <div className="truncate text-sm font-semibold">
                                        {hasItems ? `${items.length} kalem • ${totalQuantity} adet` : "Urun secerek siparis akisinizi baslatin"}
                                    </div>
                                    {totalLabel ? (
                                        <div className={cn(
                                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                            hasItems ? "bg-white/14 text-white/90" : "bg-brand/10 text-brand",
                                        )}>
                                            {totalLabel}
                                        </div>
                                    ) : null}
                                </div>
                                {hasItems && currencySummary.length > 1 ? (
                                    <div className="mt-1 text-[11px] text-white/72">
                                        {currencySummary.map((summary) => `${summary.currency} ${formatMoney(summary.customerTotal, summary.currency)}`).join(" • ")}
                                    </div>
                                ) : null}
                                {!hasItems ? (
                                    <div className="mt-1 text-[11px] text-neutral-500">
                                        Katalogdan varyant eklediginizde sepet burada canli gorunur.
                                    </div>
                                ) : null}
                            </div>

                            <ArrowRight className={cn(
                                "h-4 w-4 transition group-hover:translate-x-0.5",
                                hasItems ? "text-white/90" : "text-neutral-500",
                            )} />
                        </div>
                    </motion.div>
                </Link>
            ) : (
                <button
                    type="button"
                    onClick={handleOrderPageScroll}
                    className={cn(
                        "block w-full text-left",
                        mode === "mobile-sticky" && "mx-auto max-w-[124rem]",
                    )}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        className="group overflow-hidden rounded-[24px] border border-brand/30 bg-brand px-4 py-3 text-white shadow-xl backdrop-blur-xl transition"
                    >
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{ duration: 1.8, repeat: Infinity }}
                                className="inline-flex size-11 items-center justify-center rounded-2xl bg-white/16"
                            >
                                <Sparkles className="h-5 w-5" />
                            </motion.div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/72">
                                    Siparis Talebi
                                </div>
                                <div className="truncate text-sm font-semibold">
                                    Sepet ozeti bu sayfada hazir, kalemleri asagida duzenleyin
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-white/90 transition group-hover:translate-x-0.5" />
                        </div>
                    </motion.div>
                </button>
            )}
        </div>
    )
}
