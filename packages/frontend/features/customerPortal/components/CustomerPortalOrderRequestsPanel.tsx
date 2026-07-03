"use client"

import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { ClipboardList, RefreshCw } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { BusinessRequestTable } from "@/features/businessRequests/components/BusinessRequestTable"
import { BUSINESS_REQUEST_STATUS_LABELS } from "@/features/businessRequests/config"
import type { BusinessRequestStatus, ListBusinessRequestsParams } from "@/features/businessRequests/api/types"
import { useBusinessRequestFilters } from "@/features/businessRequests/hooks/useBusinessRequestFilters"
import { useBusinessRequests } from "@/features/businessRequests/hooks/useBusinessRequests"
import { useDecideBusinessRequest } from "@/features/businessRequests/hooks/useDecideBusinessRequest"

const orderRequestUrlKeys = {
    search: "requestSearch",
    status: "requestStatus",
    type: "requestType",
    domain: "requestDomain",
    page: "requestPage",
    limit: "requestLimit",
    refresh: "requestRefresh",
} as const

const ORDER_REQUESTS_ACCORDION_VALUE = "order-requests"

export function CustomerPortalOrderRequestsPanel() {
    const [accordionValue, setAccordionValue] = useState("")
    const isOpen = accordionValue === ORDER_REQUESTS_ACCORDION_VALUE
    const {
        filters,
        params,
        setSearch,
        setStatus,
        setLimit,
    } = useBusinessRequestFilters({
        defaultType: "CUSTOMER_ORDER_REQUEST",
        urlKeys: orderRequestUrlKeys,
    })

    const requestParams = useMemo<ListBusinessRequestsParams>(
        () => ({
            ...params,
            type: "CUSTOMER_ORDER_REQUEST",
        }),
        [params],
    )

    const requestsQuery = useBusinessRequests({
        scope: "portal",
        params: requestParams,
        enabled: isOpen,
    })
    const decideMutation = useDecideBusinessRequest()

    const lastUpdatedLabel = requestsQuery.dataUpdatedAt
        ? new Intl.DateTimeFormat("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(new Date(requestsQuery.dataUpdatedAt))
        : "-"
    const totalCount = requestsQuery.data?.meta.total ?? 0
    const totalBadgeLabel = requestsQuery.data ? `${totalCount} talep` : "Açınca yüklenecek"

    return (
        <Accordion
            type="single"
            collapsible
            value={accordionValue}
            onValueChange={setAccordionValue}
            className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm"
        >
            <AccordionItem value={ORDER_REQUESTS_ACCORDION_VALUE} className="border-b-0">
                <AccordionTrigger className="px-5 py-5 hover:no-underline data-[state=open]:border-b data-[state=open]:border-neutral-200">
                    <span className="flex min-w-0 flex-1 flex-col gap-4 text-left lg:flex-row lg:items-start lg:justify-between">
                        <span className="min-w-0 space-y-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
                                <ClipboardList className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                                Sipariş talep süreci
                            </span>
                            <span className="block">
                                <span className="block text-xl font-semibold tracking-tight text-neutral-950">Sipariş Taleplerim</span>
                                <span className="mt-1 block max-w-3xl text-sm leading-6 text-neutral-500">
                                    Henüz onay akışında olan veya geçmişte tamamlanmış sipariş taleplerinizi buradan takip edin.
                                </span>
                            </span>
                        </span>

                        <span className="flex shrink-0 flex-wrap items-center gap-2 pr-2">
                            <Badge variant="outline" className="bg-white">
                                {totalBadgeLabel}
                            </Badge>
                            {requestsQuery.isFetching ? (
                                <Badge variant="secondary" className="gap-1.5">
                                    <motion.span
                                        className="inline-flex"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    </motion.span>
                                    Yükleniyor
                                </Badge>
                            ) : null}
                        </span>
                    </span>
                </AccordionTrigger>

                <AccordionContent className="space-y-4 px-5 pb-5 pt-4">
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            disabled={requestsQuery.isFetching}
                            onClick={() => void requestsQuery.refetch()}
                        >
                            <motion.span
                                className="inline-flex"
                                animate={requestsQuery.isFetching ? { rotate: 360 } : { rotate: 0 }}
                                transition={requestsQuery.isFetching
                                    ? { duration: 0.9, repeat: Infinity, ease: "linear" }
                                    : { duration: 0.2 }}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </motion.span>
                            Yenile
                        </Button>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_220px_160px]">
                        <Input
                            value={filters.search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Sipariş talebi, ürün veya referans ara"
                        />

                        <Select value={filters.status || "__all__"} onValueChange={(value) => setStatus(value === "__all__" ? "" : value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Durum" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">Tüm durumlar</SelectItem>
                                {(Object.entries(BUSINESS_REQUEST_STATUS_LABELS) as Array<[BusinessRequestStatus, string]>).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={String(filters.limit)} onValueChange={(value) => setLimit(Number(value))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sayfa boyutu" />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50, 100].map((value) => (
                                    <SelectItem key={value} value={String(value)}>
                                        {value} kayıt
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                        <span>Son güncelleme: {lastUpdatedLabel}</span>
                        <span>{requestsQuery.isFetching ? "Sipariş talepleri yenileniyor..." : "Sipariş talepleri güncel"}</span>
                    </div>

                    <BusinessRequestTable
                        requests={requestsQuery.data?.data ?? []}
                        isLoading={requestsQuery.isLoading}
                        emptyMessage="Henüz sipariş talebiniz bulunmuyor."
                        showRequester={false}
                        decisionScope="portal"
                        onDecision={(input) => decideMutation.mutateAsync(input)}
                        isDecisionPending={decideMutation.isPending}
                    />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}
