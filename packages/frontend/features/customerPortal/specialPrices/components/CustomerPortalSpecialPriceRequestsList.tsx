"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Activity, Clock3, FileText, PackageSearch } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { BusinessRequestApprovalRoleBadge } from "@/features/businessRequests/components/BusinessRequestApprovalFlowPanel"
import { BusinessRequestStatusBadge } from "@/features/businessRequests/components/BusinessRequestStatusBadge"
import { useBusinessRequests } from "@/features/businessRequests/hooks/useBusinessRequests"
import type { BusinessRequest } from "@/features/businessRequests/api/types"
import { getCurrentPendingStep } from "@/features/businessRequests/lib/businessRequestAccess"
import { formatMoney } from "@/lib/customers/pricing"

function isSpecialPriceRequest(request: BusinessRequest) {
    return request.type === "CUSTOMER_PRICING_REQUEST"
        && request.requestedData?.requestKind === "CUSTOMER_SPECIAL_PRICE_REQUEST"
        && request.status !== "APPROVED"
}

function formatDate(value?: string | null) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "-"

    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

function getSpecialPricePayload(request: BusinessRequest) {
    const specialPrice = request.requestedData?.specialPrice
    return specialPrice && typeof specialPrice === "object" && !Array.isArray(specialPrice)
        ? specialPrice as Record<string, unknown>
        : {}
}

function getSnapshot(request: BusinessRequest, key: "productSnapshot" | "variantSnapshot") {
    const snapshot = request.requestedData?.[key]
    return snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
        ? snapshot as Record<string, unknown>
        : {}
}

export function CustomerPortalSpecialPriceRequestsList() {
    const [isOpen, setIsOpen] = useState(false)
    const requestsQuery = useBusinessRequests({
        scope: "portal",
        params: {
            type: "CUSTOMER_PRICING_REQUEST",
            limit: 50,
        },
        autoRefreshIntervalMs: isOpen ? 30000 : false,
        enabled: isOpen,
    })
    const requests = (requestsQuery.data?.data ?? []).filter(isSpecialPriceRequest)

    return (
        <motion.div
            animate={isOpen ? {
                scale: 1,
                borderColor: "rgba(229, 231, 235, 1)",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            } : {
                scale: [1, 1.008, 0.996, 1.012, 1, 1],
                borderColor: [
                    "rgba(229, 231, 235, 1)",
                    "rgba(204, 179, 110, 0.5)",
                    "rgba(229, 231, 235, 1)",
                    "rgba(204, 179, 110, 0.8)",
                    "rgba(229, 231, 235, 1)",
                    "rgba(229, 231, 235, 1)",
                ],
                boxShadow: [
                    "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    "0 0 12px 2px rgba(204, 179, 110, 0.2)",
                    "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    "0 0 18px 4px rgba(204, 179, 110, 0.35)",
                    "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                ],
            }}
            transition={isOpen ? { duration: 0.3 } : {
                duration: 2.2,
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: "easeInOut",
            }}
            className="overflow-hidden rounded-2xl border bg-white"
        >
            <Accordion
                type="single"
                collapsible
                value={isOpen ? "special-price-requests" : ""}
                onValueChange={(value) => setIsOpen(value === "special-price-requests")}
            >
                <AccordionItem value="special-price-requests" className="border-b-0">
                    <AccordionTrigger className="px-5 py-4 text-sm font-semibold text-neutral-900 transition-colors duration-200 hover:bg-brand/[0.02] hover:no-underline">
                        <div className="flex flex-1 items-center justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                                    <motion.div
                                        animate={isOpen ? { scale: 1 } : { scale: [1, 1.2, 0.95, 1.25, 1, 1] }}
                                        transition={isOpen ? {} : {
                                            duration: 2.2,
                                            repeat: Infinity,
                                            repeatDelay: 1.5,
                                            ease: "easeInOut",
                                        }}
                                    >
                                        <Activity className="h-5 w-5" />
                                    </motion.div>
                                </div>
                                <div className="min-w-0 text-left">
                                    <p className="font-semibold text-neutral-900">Özel Fiyat Taleplerim</p>
                                    <p className="hidden text-xs font-normal text-neutral-500 sm:block">
                                        Onay bekleyen veya sonuçlanmamış özel fiyat taleplerinizi takip edin.
                                    </p>
                                </div>
                            </div>
                            <div className="mr-2 flex items-center gap-3">
                                {requestsQuery.data ? (
                                    <Badge variant="outline" className="bg-white">
                                        {requests.length} talep
                                    </Badge>
                                ) : null}
                                {!isOpen ? (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="hidden items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand sm:inline-flex"
                                    >
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
                                        </span>
                                        Talepleri Aç
                                    </motion.span>
                                ) : null}
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {requestsQuery.isLoading ? (
                                <div className="rounded-[24px] border border-neutral-200 bg-white p-5 text-sm text-neutral-500 shadow-sm">
                                    Özel fiyat talepleri yükleniyor...
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-neutral-200 bg-white px-6 py-12 text-center shadow-sm">
                                    <PackageSearch className="h-8 w-8 text-neutral-400" />
                                    <div>
                                        <h3 className="text-base font-semibold text-neutral-950">Henüz özel fiyat talebiniz yok</h3>
                                        <p className="mt-1 max-w-xl text-sm leading-6 text-neutral-500">
                                            Ürün veya varyant seçerek satış ekibine özel fiyat talebi iletebilirsiniz. Onaylanan talepler özel fiyatlar listenize taşınır.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {requests.map((request) => {
                                        const specialPrice = getSpecialPricePayload(request)
                                        const productSnapshot = getSnapshot(request, "productSnapshot")
                                        const variantSnapshot = getSnapshot(request, "variantSnapshot")
                                        const currentStep = getCurrentPendingStep(request)
                                        const price = typeof specialPrice.price === "number" ? specialPrice.price : null
                                        const currency = typeof specialPrice.currency === "string" ? specialPrice.currency : "TRY"

                                        return (
                                            <article key={request.id} className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
                                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="min-w-0 space-y-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <BusinessRequestStatusBadge status={request.status} />
                                                            {currentStep ? (
                                                                <BusinessRequestApprovalRoleBadge role={currentStep.requiredRole} status={currentStep.status} />
                                                            ) : null}
                                                            <Badge variant="outline" className="gap-1 bg-neutral-50">
                                                                <Clock3 className="h-3.5 w-3.5" />
                                                                {formatDate(request.createdAt)}
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-semibold text-neutral-950">
                                                                {typeof productSnapshot.code === "string" ? `${productSnapshot.code} - ` : ""}
                                                                {typeof productSnapshot.name === "string" ? productSnapshot.name : request.title}
                                                            </h3>
                                                            <p className="mt-1 text-sm leading-6 text-neutral-500">
                                                                {typeof variantSnapshot.fullCode === "string" ? variantSnapshot.fullCode : "Varyant bilgisi"}
                                                                {typeof variantSnapshot.measurementSummary === "string" ? ` · ${variantSnapshot.measurementSummary}` : ""}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-2 text-sm sm:grid-cols-2 lg:min-w-[360px]">
                                                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                                                            <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">Talep edilen fiyat</div>
                                                            <div className="mt-1 font-semibold text-neutral-950">
                                                                {price !== null ? formatMoney(price, currency) : "-"}
                                                            </div>
                                                        </div>
                                                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                                                            <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">Koşul</div>
                                                            <div className="mt-1 font-medium text-neutral-800">
                                                                {typeof specialPrice.paymentTermLabel === "string" && specialPrice.paymentTermLabel
                                                                    ? specialPrice.paymentTermLabel
                                                                    : "Vade belirtilmedi"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {typeof specialPrice.note === "string" && specialPrice.note.trim() ? (
                                                    <div className="mt-3 flex gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm leading-6 text-neutral-600">
                                                        <FileText className="mt-1 h-4 w-4 shrink-0 text-neutral-400" />
                                                        {specialPrice.note}
                                                    </div>
                                                ) : null}
                                            </article>
                                        )
                                    })}
                                </div>
                            )}
                        </motion.div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </motion.div>
    )
}
