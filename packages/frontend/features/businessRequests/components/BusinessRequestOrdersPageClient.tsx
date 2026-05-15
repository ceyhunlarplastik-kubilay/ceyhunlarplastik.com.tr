"use client"

import { motion } from "motion/react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BusinessRequestFilters } from "@/features/businessRequests/components/BusinessRequestFilters"
import { BusinessRequestTable } from "@/features/businessRequests/components/BusinessRequestTable"
import { useBusinessRequestFilters } from "@/features/businessRequests/hooks/useBusinessRequestFilters"
import { useBusinessRequests } from "@/features/businessRequests/hooks/useBusinessRequests"
import type { BusinessRequestListScope } from "@/features/businessRequests/api/types"

type Props = {
    description: string
    scope: Exclude<BusinessRequestListScope, "portal" | "purchasing">
    title: string
}

export function BusinessRequestOrdersPageClient({
    description,
    scope,
    title,
}: Props) {
    const {
        filters,
        params,
        setSearch,
        setStatus,
        setType,
        setLimit,
    } = useBusinessRequestFilters({
        defaultType: "CUSTOMER_ORDER_REQUEST",
    })

    const requestsQuery = useBusinessRequests({
        scope,
        params,
    })

    const lastUpdatedLabel = requestsQuery.dataUpdatedAt
        ? new Intl.DateTimeFormat("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(new Date(requestsQuery.dataUpdatedAt))
        : "-"

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
                    <p className="text-sm text-neutral-500">{description}</p>
                </div>

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

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                <span>Son güncelleme: {lastUpdatedLabel}</span>
                <span>{requestsQuery.isFetching ? "Liste yenileniyor..." : "Liste güncel"}</span>
            </div>

            <BusinessRequestFilters
                search={filters.search}
                status={filters.status}
                type={filters.type}
                limit={filters.limit}
                onSearchChange={setSearch}
                onStatusChange={setStatus}
                onTypeChange={setType}
                onLimitChange={setLimit}
                allowedTypes={["CUSTOMER_ORDER_REQUEST"]}
            />

            <BusinessRequestTable
                requests={requestsQuery.data?.data ?? []}
                isLoading={requestsQuery.isLoading}
                emptyMessage="Sipariş talebi bulunamadı."
                showRequester
            />
        </div>
    )
}
