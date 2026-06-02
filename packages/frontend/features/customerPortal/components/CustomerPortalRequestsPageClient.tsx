"use client"

import { motion } from "motion/react"
import { ClipboardList, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BusinessRequestFilters } from "@/features/businessRequests/components/BusinessRequestFilters"
import { BusinessRequestTable } from "@/features/businessRequests/components/BusinessRequestTable"
import { useBusinessRequestFilters } from "@/features/businessRequests/hooks/useBusinessRequestFilters"
import { useBusinessRequests } from "@/features/businessRequests/hooks/useBusinessRequests"
import { useDecideBusinessRequest } from "@/features/businessRequests/hooks/useDecideBusinessRequest"
import { CUSTOMER_PORTAL_REQUEST_TYPES } from "@/features/businessRequests/config"
import { CustomerPortalPageHeader } from "@/features/customerPortal/components/CustomerPortalPageHeader"

export function CustomerPortalRequestsPageClient() {
    const {
        filters,
        params,
        setSearch,
        setStatus,
        setType,
        setLimit,
    } = useBusinessRequestFilters()

    const requestsQuery = useBusinessRequests({
        scope: "portal",
        params,
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
            <CustomerPortalPageHeader
                eyebrow="Talep Merkezi"
                icon={ClipboardList}
                title="Taleplerim"
                description={(
                    <>
                        Gönderdiğiniz sipariş, fiyat, profil değişikliği ve doküman taleplerini burada izleyin.
                        Yeni talep girişleri sol menüdeki özel akışlardan açılır.
                    </>
                )}
                meta={[
                    { value: lastUpdatedLabel, label: "son güncelleme" },
                ]}
                aside={(
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2 bg-white/80 backdrop-blur"
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
                )}
            />
            <div className="space-y-4 rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                    <span>Son güncelleme: {lastUpdatedLabel}</span>
                    <span>{requestsQuery.isFetching ? "Liste yenileniyor..." : "Talep geçmişi güncel"}</span>
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
                    allowedTypes={CUSTOMER_PORTAL_REQUEST_TYPES}
                />

                <BusinessRequestTable
                    requests={requestsQuery.data?.data ?? []}
                    isLoading={requestsQuery.isLoading}
                    emptyMessage="Henüz portal talebiniz bulunmuyor."
                    showRequester={false}
                    decisionScope="portal"
                    onDecision={(input) => decideMutation.mutateAsync(input)}
                    isDecisionPending={decideMutation.isPending}
                />
            </div>
        </div>
    )
}
