"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { CartShortcutKbd } from "@/features/customerPortal/components/CartShortcutKbd"
import { buildCurrencySummary, resolveCustomerPortalCartCta } from "@/features/customerPortal/components/requestComposer/helpers"
import { usePortalCartLoad } from "@/features/customerPortal/hooks/usePortalCartLoad"
import { useCartDrawerStore } from "@/features/customerPortal/stores/useCartDrawerStore"
import { usePortalRequestDraftStore } from "@/features/customerPortal/stores/usePortalRequestDraftStore"
import { formatMoney } from "@/lib/customers/pricing"
import { cn } from "@/lib/utils"

type Props = {
    mode: "topbar" | "mobile-sticky"
}

const VOLUME_FORMATTER = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 })
const PERCENT_FORMATTER = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 })

function compactFillLabel(fillPercent: number) {
    if (fillPercent > 0 && fillPercent < 1) return "%1'den az"
    return `%${PERCENT_FORMATTER.format(fillPercent)}`
}

export function CustomerPortalCartDock({ mode }: Props) {
    const pathname = usePathname()
    const shouldReduceMotion = useReducedMotion()
    const items = usePortalRequestDraftStore((state) => state.items)
    const openCartDrawer = useCartDrawerStore((state) => state.open)
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const hasItems = items.length > 0
    const currencySummary = buildCurrencySummary(items)
    const { logisticsQuery, summary } = usePortalCartLoad(items)
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

    const totalLabel = currencySummary.length === 1
        ? formatMoney(currencySummary[0].customerTotal, currencySummary[0].currency)
        : currencySummary.length > 1
            ? currencySummary
                .map((entry) => formatMoney(entry.customerTotal, entry.currency))
                .join(" • ")
            : null

    const logisticsLabel = !hasItems
        ? null
        : logisticsQuery.isPending
            ? "Hacim hesaplanıyor"
            : logisticsQuery.isError
                ? "Hacim hesaplanamadı"
                : !summary.isComplete
                    ? summary.hasKnownVolume
                        ? `${VOLUME_FORMATTER.format(summary.totalVolumeM3)} m³+ • koli verisi eksik`
                        : "Koli verisi eksik"
                    : summary.automaticLoad
                        ? `${VOLUME_FORMATTER.format(summary.totalVolumeM3)} m³ • ${summary.automaticLoad.requiredVehicleCount > 1
                            ? `${summary.automaticLoad.requiredVehicleCount} × `
                            : ""}${summary.automaticLoad.carrier.compactLabel} • ${summary.automaticLoad.requiredVehicleCount > 1
                            ? "son "
                            : ""}${compactFillLabel(summary.automaticLoad.lastVehicleFillPercent)}`
                        : null

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
            <div className="flex items-center gap-3">
                <div className={cn(
                    "inline-flex size-11 shrink-0 items-center justify-center rounded-2xl",
                    hasItems ? "bg-brand/15 text-brand" : "bg-brand/10 text-brand",
                )}>
                    {cta.mode === "scroll"
                        ? <Sparkles className="h-5 w-5" aria-hidden="true" />
                        : <ShoppingBag className="h-5 w-5" aria-hidden="true" />}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                        <span className="shrink-0">{hasItems ? "Sipariş Sepeti" : "Hazır Sepet"}</span>
                        {logisticsLabel ? (
                            <>
                                <span aria-hidden="true">•</span>
                                <span className="truncate normal-case tracking-normal text-neutral-700">
                                    {logisticsLabel}
                                </span>
                            </>
                        ) : null}
                    </div>
                    <div className="mt-0.5 flex min-w-0 items-center gap-2 text-sm font-semibold">
                        <span className="shrink-0">
                            {hasItems ? `${items.length} kalem • ${totalQuantity} adet` : "Ürün seçerek sipariş akışını başlatın"}
                        </span>
                        {totalLabel ? (
                            <span className="truncate rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-neutral-800">
                                {totalLabel}
                            </span>
                        ) : null}
                    </div>
                </div>

                {hasItems && mode === "topbar" ? (
                    <CartShortcutKbd className="hidden [&>kbd]:bg-brand/10 [&>kbd]:text-brand lg:flex" />
                ) : null}

                <ArrowRight
                    className="h-4 w-4 shrink-0 text-neutral-500 transition group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                    aria-hidden="true"
                />
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
                    <button type="button" onClick={openCartDrawer} className={wrapperClassName}>
                        {card}
                    </button>
                ) : (
                    <Link href={cta.href} className={wrapperClassName}>
                        {card}
                    </Link>
                )
            ) : (
                <button type="button" onClick={handleOrderPageScroll} className={wrapperClassName}>
                    {card}
                </button>
            )}
        </div>
    )
}
