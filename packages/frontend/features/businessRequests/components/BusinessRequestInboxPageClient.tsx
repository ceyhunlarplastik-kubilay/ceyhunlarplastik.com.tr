"use client"

import { motion } from "motion/react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BusinessRequestFilters } from "@/features/businessRequests/components/BusinessRequestFilters"
import { BusinessRequestTable } from "@/features/businessRequests/components/BusinessRequestTable"
import { useBusinessRequestFilters } from "@/features/businessRequests/hooks/useBusinessRequestFilters"
import { useBusinessRequests } from "@/features/businessRequests/hooks/useBusinessRequests"
import { useDecideBusinessRequest } from "@/features/businessRequests/hooks/useDecideBusinessRequest"
import type {
    BusinessRequestDecisionScope,
    BusinessRequestDomain,
    BusinessRequestType,
    BusinessRequestListScope,
} from "@/features/businessRequests/api/types"

type Props = {
    scope: Exclude<BusinessRequestListScope, "portal">
    title: string
    description: string
    defaultDomain?: BusinessRequestDomain
    allowedTypes?: readonly BusinessRequestType[]
    showDomainFilter?: boolean
}

export function BusinessRequestInboxPageClient({
    scope,
    title,
    description,
    defaultDomain,
    allowedTypes,
    showDomainFilter = false,
}: Props) {
    const {
        filters,
        params,
        setSearch,
        setStatus,
        setType,
        setDomain,
        setLimit,
    } = useBusinessRequestFilters({
        defaultStatus: "PENDING_APPROVAL",
        defaultDomain: defaultDomain ?? "",
    })

    const requestsQuery = useBusinessRequests({
        scope,
        params,
        autoRefreshIntervalMs: filters.refreshIntervalSeconds > 0
            ? filters.refreshIntervalSeconds * 1000
            : false,
    })
    const decideMutation = useDecideBusinessRequest()

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
                domain={filters.domain}
                limit={filters.limit}
                onSearchChange={setSearch}
                onStatusChange={setStatus}
                onTypeChange={setType}
                onDomainChange={setDomain}
                onLimitChange={setLimit}
                allowedTypes={allowedTypes}
                showDomainFilter={showDomainFilter}
            />

            <BusinessRequestTable
                requests={requestsQuery.data?.data ?? []}
                isLoading={requestsQuery.isLoading}
                emptyMessage="Filtreye uygun talep bulunamadı."
                showRequester
                showDomain={showDomainFilter}
                decisionScope={scope as BusinessRequestDecisionScope}
                onDecision={(input) => {
                    decideMutation.mutate(input)
                }}
                isDecisionPending={decideMutation.isPending}
            />
        </div>
    )
}
