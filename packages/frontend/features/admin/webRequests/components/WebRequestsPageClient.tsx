"use client"

import { Fragment, useEffect, useReducer } from "react"
import { motion } from "motion/react"
import { ChevronDown, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import type { AdminWebRequest, AdminWebRequestItem, AdminWebRequestItemResolved } from "@/features/admin/webRequests/api/types"
import { getWebRequestItemDetails } from "@/features/admin/webRequests/api/getWebRequestItemDetails"
import { useWebRequests } from "@/features/admin/webRequests/hooks/useWebRequests"
import { useUpdateWebRequestStatus } from "@/features/admin/webRequests/hooks/useUpdateWebRequestStatus"
import { useWebRequestListFilters, WEB_REQUEST_STATUS_VALUES } from "@/features/admin/webRequests/hooks/useWebRequestListFilters"
import { WebRequestFilters } from "@/features/admin/webRequests/components/WebRequestFilters"
import { WebRequestStatusBadge, WEB_REQUEST_STATUS_LABELS } from "@/features/admin/webRequests/components/WebRequestStatusBadge"

type WebRequestStatus = (typeof WEB_REQUEST_STATUS_VALUES)[number]

const EMPTY_REQUESTS: AdminWebRequest[] = []

type UiState = {
    expandedId: string | null
    statusById: Record<string, WebRequestStatus>
    detailsById: Record<string, AdminWebRequestItemResolved[]>
    loadingDetailsById: Record<string, boolean>
}

type UiAction =
    | { type: "toggleExpanded"; id: string }
    | { type: "syncStatuses"; statuses: Record<string, WebRequestStatus> }
    | { type: "setStatusDraft"; id: string; status: WebRequestStatus }
    | { type: "startLoadingDetails"; id: string }
    | { type: "setDetails"; id: string; details: AdminWebRequestItemResolved[] }
    | { type: "finishLoadingDetails"; id: string }

function uiReducer(state: UiState, action: UiAction): UiState {
    switch (action.type) {
        case "toggleExpanded":
            return {
                ...state,
                expandedId: state.expandedId === action.id ? null : action.id,
            }
        case "syncStatuses":
            return {
                ...state,
                statusById: action.statuses,
            }
        case "setStatusDraft":
            return {
                ...state,
                statusById: {
                    ...state.statusById,
                    [action.id]: action.status,
                },
            }
        case "startLoadingDetails":
            return {
                ...state,
                loadingDetailsById: {
                    ...state.loadingDetailsById,
                    [action.id]: true,
                },
            }
        case "setDetails":
            return {
                ...state,
                detailsById: {
                    ...state.detailsById,
                    [action.id]: action.details,
                },
            }
        case "finishLoadingDetails":
            return {
                ...state,
                loadingDetailsById: {
                    ...state.loadingDetailsById,
                    [action.id]: false,
                },
            }
        default:
            return state
    }
}

function parseRequestItems(items: unknown): AdminWebRequestItem[] {
    if (!Array.isArray(items)) return []
    return items
        .map((item) => item as AdminWebRequestItem)
        .filter((item) => Boolean(item?.productId) && Boolean(item?.variantKey))
}

export function WebRequestsPageClient() {
    const [uiState, dispatch] = useReducer(uiReducer, {
        expandedId: null,
        statusById: {},
        detailsById: {},
        loadingDetailsById: {},
    })

    const {
        filters,
        params,
        setSearch,
        setStatus,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
    } = useWebRequestListFilters()

    const webRequestsQuery = useWebRequests({
        params,
        autoRefreshIntervalMs: filters.refreshIntervalSeconds > 0
            ? filters.refreshIntervalSeconds * 1000
            : false,
    })
    const updateStatusMutation = useUpdateWebRequestStatus()
    const webRequests = webRequestsQuery.data?.data ?? EMPTY_REQUESTS
    const meta = webRequestsQuery.data?.meta

    useEffect(() => {
        const next: Record<string, WebRequestStatus> = {}

        for (const request of webRequests) {
            const normalized = request.status?.toUpperCase() as WebRequestStatus
            next[request.id] = WEB_REQUEST_STATUS_VALUES.includes(normalized)
                ? normalized
                : "NEW"
        }

        const prevKeys = Object.keys(uiState.statusById)
        const nextKeys = Object.keys(next)
        const changed =
            prevKeys.length !== nextKeys.length ||
            nextKeys.some((key) => uiState.statusById[key] !== next[key])

        if (changed) {
            dispatch({ type: "syncStatuses", statuses: next })
        }
    }, [uiState.statusById, webRequests])

    async function toggleDetails(request: AdminWebRequest) {
        const nextOpen = uiState.expandedId === request.id ? null : request.id
        dispatch({ type: "toggleExpanded", id: request.id })

        if (!nextOpen) return
        if (uiState.detailsById[request.id]) return

        const items = parseRequestItems(request.items)
        if (items.length === 0) {
            dispatch({ type: "setDetails", id: request.id, details: [] })
            return
        }

        dispatch({ type: "startLoadingDetails", id: request.id })

        try {
            const resolved = await getWebRequestItemDetails(items)
            dispatch({ type: "setDetails", id: request.id, details: resolved })
        } catch (error) {
            console.error(error)
            toast.error("Sepet detayları yüklenemedi.")
        } finally {
            dispatch({ type: "finishLoadingDetails", id: request.id })
        }
    }

    async function handleSaveStatus(request: AdminWebRequest) {
        const nextStatus = uiState.statusById[request.id]
        const currentStatus = request.status?.toUpperCase()

        if (!nextStatus || nextStatus === currentStatus) return

        try {
            await updateStatusMutation.mutateAsync({
                id: request.id,
                status: nextStatus,
            })
            toast.success("Talep durumu güncellendi.")
        } catch (error) {
            console.error(error)
            toast.error("Durum güncellenemedi.")
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Web Talepleri</h1>
                <p className="text-neutral-500 text-sm">
                    Sepetten gönderilen talepleri arayın, filtreleyin ve durumlarını takip edin.
                </p>
            </div>

            <WebRequestFilters
                search={filters.search}
                status={filters.status}
                onSearchChange={setSearch}
                onStatusChange={setStatus}
            />

            <AdminListRefreshBar
                dataUpdatedAt={webRequestsQuery.dataUpdatedAt}
                isFetching={webRequestsQuery.isFetching}
                onRefresh={() => void webRequestsQuery.refetch()}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
            />

            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Talep</TableHead>
                            <TableHead>İletişim</TableHead>
                            <TableHead>Sepet</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right pr-4">Tarih</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {webRequestsQuery.isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-12">
                                    <div className="flex items-center justify-center">
                                        <Spinner className="size-5" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : webRequests.map((request) => {
                            const isExpanded = uiState.expandedId === request.id
                            const items = parseRequestItems(request.items)
                            const resolvedItems = uiState.detailsById[request.id] ?? []
                            const isDetailsLoading = uiState.loadingDetailsById[request.id]
                            const selectedStatus = uiState.statusById[request.id] ?? "NEW"

                            return (
                                <Fragment key={request.id}>
                                    <TableRow className={isExpanded ? "bg-neutral-50/60" : undefined}>
                                        <TableCell>
                                            <div className="font-medium">{request.name}</div>
                                            <div className="text-xs text-neutral-500 line-clamp-2">
                                                {request.message || "Mesaj yok"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{request.email}</div>
                                            <div className="text-xs text-neutral-500">{request.phone || "-"}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 gap-1"
                                                onClick={() => void toggleDetails(request)}
                                            >
                                                <Badge variant="secondary" className="mr-1">
                                                    {items.length} kalem
                                                </Badge>
                                                Detay
                                                <ChevronDown
                                                    className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                                />
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2">
                                                <WebRequestStatusBadge status={selectedStatus} />
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        value={selectedStatus}
                                                        onValueChange={(value) =>
                                                            dispatch({
                                                                type: "setStatusDraft",
                                                                id: request.id,
                                                                status: value as WebRequestStatus,
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 w-[190px] text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {WEB_REQUEST_STATUS_VALUES.map((value) => (
                                                                <SelectItem key={value} value={value}>
                                                                    {WEB_REQUEST_STATUS_LABELS[value]}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 px-2"
                                                        disabled={updateStatusMutation.isPending}
                                                        onClick={() => void handleSaveStatus(request)}
                                                    >
                                                        {updateStatusMutation.isPending ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Save className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-4 text-sm text-neutral-500">
                                            {new Date(request.createdAt).toLocaleDateString("tr-TR")}
                                        </TableCell>
                                    </TableRow>

                                    {isExpanded && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="p-0">
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.22, ease: "easeInOut" }}
                                                    className="overflow-hidden border-t bg-white"
                                                >
                                                    <div className="p-4">
                                                        {isDetailsLoading ? (
                                                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                                                                <Spinner className="size-4" />
                                                                Sepet detayları yükleniyor...
                                                            </div>
                                                        ) : resolvedItems.length === 0 ? (
                                                            <p className="text-sm text-neutral-500">Bu talepte ürün detayı bulunamadı.</p>
                                                        ) : (
                                                            <div className="grid gap-2 sm:grid-cols-2">
                                                                {resolvedItems.map((item, index) => (
                                                                    <motion.div
                                                                        key={`${request.id}-${item.productId}-${item.variantId ?? index}`}
                                                                        initial={{ opacity: 0, y: 4 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ duration: 0.18, delay: index * 0.03 }}
                                                                        className="rounded-lg border border-neutral-200 p-3"
                                                                    >
                                                                        <p className="text-sm font-medium text-neutral-900">
                                                                            {item.resolvedProductName || item.productName || item.productId}
                                                                        </p>
                                                                        <p className="text-xs text-neutral-500">
                                                                            Kod: {item.resolvedProductCode || item.productCode || "-"}
                                                                        </p>
                                                                        <p className="text-xs text-neutral-600 mt-1">
                                                                            Varyant: {item.resolvedVariantCode || item.variantFullCode || item.variantKey}
                                                                        </p>
                                                                        <p className="text-xs text-neutral-600">Adet: {item.quantity}</p>
                                                                    </motion.div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            )
                        })}

                        {!webRequestsQuery.isLoading && webRequests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="py-10 text-center text-sm text-neutral-500">
                                    Talep bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AdminListPagination
                page={meta?.page ?? filters.page}
                totalPages={meta?.totalPages ?? 1}
                total={meta?.total}
                limit={filters.limit}
                itemLabel="talep"
                onPageChange={setPage}
                onLimitChange={setLimit}
            />

            {webRequestsQuery.isFetching && !webRequestsQuery.isLoading && (
                <div className="inline-flex items-center gap-2 text-sm text-neutral-500">
                    <Spinner className="size-4" />
                    Liste güncelleniyor...
                </div>
            )}
        </div>
    )
}
