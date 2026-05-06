"use client"

import { Fragment, useMemo, useReducer } from "react"
import { Check, ChevronDown, RefreshCw, X } from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SupplierApprovalRequestFilters } from "@/features/admin/supplierApprovalRequests/components/SupplierApprovalRequestFilters"
import { SupplierApprovalRequestStatusBadge } from "@/features/admin/supplierApprovalRequests/components/SupplierApprovalRequestStatusBadge"
import {
    SUPPLIER_APPROVAL_TYPE_LABELS,
} from "@/features/admin/supplierApprovalRequests/config"
import { useSupplierApprovalRequestFilters } from "@/features/admin/supplierApprovalRequests/hooks/useSupplierApprovalRequestFilters"
import { useSupplierApprovalRequests } from "@/features/admin/supplierApprovalRequests/hooks/useSupplierApprovalRequests"
import { useDecideSupplierApprovalRequest } from "@/features/admin/supplierApprovalRequests/hooks/useDecideSupplierApprovalRequest"
import type { AdminSupplierApprovalRequest } from "@/features/admin/supplierApprovalRequests/api/types"

const FIELD_LABELS: Record<string, string> = {
    name: "Firma Adı",
    contactName: "Yetkili",
    phone: "Telefon",
    address: "Adres",
    taxNumber: "Vergi No",
    defaultPaymentTermDays: "Varsayılan Vade",
    price: "Maliyet",
    operationalCostRate: "Operasyonel Maliyet %",
    netCost: "Net Maliyet",
    profitRate: "Kar Oranı %",
    listPrice: "Liste Fiyatı",
    paymentTermDays: "Vade",
    supplierVariantCode: "Tedarikçi Varyant Kodu",
    supplierNote: "Tedarikçi Notu",
    minOrderQty: "Minimum Sipariş",
    stockQty: "Stok",
    currency: "Para Birimi",
}

type UiState = {
    expandedId: string | null
    noteById: Record<string, string>
}

type UiAction =
    | { type: "toggleExpanded"; id: string }
    | { type: "setNote"; id: string; note: string }
    | { type: "clearNote"; id: string }

function uiReducer(state: UiState, action: UiAction): UiState {
    switch (action.type) {
        case "toggleExpanded":
            return {
                ...state,
                expandedId: state.expandedId === action.id ? null : action.id,
            }
        case "setNote":
            return {
                ...state,
                noteById: {
                    ...state.noteById,
                    [action.id]: action.note,
                },
            }
        case "clearNote": {
            const rest = { ...state.noteById }
            delete rest[action.id]
            return {
                ...state,
                noteById: rest,
            }
        }
        default:
            return state
    }
}

function renderValue(value: unknown) {
    if (value === null || value === undefined || value === "") return "-"
    if (typeof value === "boolean") return value ? "Evet" : "Hayır"
    return String(value)
}

function getTargetLabel(request: AdminSupplierApprovalRequest) {
    if (request.type === "SUPPLIER_PROFILE_UPDATE") {
        return `${request.supplier.name} profili`
    }

    return request.productVariantSupplier?.variant?.fullCode
        ?? request.productVariantSupplier?.variant?.name
        ?? "Varyant kaydı"
}

export function SupplierApprovalRequestsPageClient() {
    const [uiState, dispatch] = useReducer(uiReducer, {
        expandedId: null,
        noteById: {},
    })

    const {
        filters,
        params,
        setSearch,
        setStatus,
        setType,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
    } = useSupplierApprovalRequestFilters()

    const requestsQuery = useSupplierApprovalRequests({
        params,
        autoRefreshIntervalMs: filters.refreshIntervalSeconds > 0
            ? filters.refreshIntervalSeconds * 1000
            : false,
    })
    const decideMutation = useDecideSupplierApprovalRequest()

    const requests = requestsQuery.data?.data ?? []
    const meta = requestsQuery.data?.meta
    const lastUpdatedLabel = requestsQuery.dataUpdatedAt
        ? new Intl.DateTimeFormat("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(new Date(requestsQuery.dataUpdatedAt))
        : "-"

    const autoRefreshLabel = useMemo(() => {
        if (filters.refreshIntervalSeconds <= 0) return "Otomatik yenileme kapalı"
        return `${filters.refreshIntervalSeconds} sn otomatik yenileme açık`
    }, [filters.refreshIntervalSeconds])

    async function handleDecision(request: AdminSupplierApprovalRequest, approved: boolean) {
        await decideMutation.mutateAsync({
            id: request.id,
            approved,
            note: uiState.noteById[request.id]?.trim() || undefined,
        })

        dispatch({ type: "clearNote", id: request.id })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Tedarikçi Onay Talepleri</h1>
                    <p className="text-sm text-neutral-500">
                        Supplier kullanıcılarının talep ettiği profil ve varyant değişikliklerini inceleyip karara bağlayın.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        <motion.span
                            className="inline-block h-2 w-2 rounded-full bg-emerald-500"
                            animate={filters.refreshIntervalSeconds > 0
                                ? { scale: [1, 1.35, 1], opacity: [0.75, 1, 0.75] }
                                : { scale: 1, opacity: 0.55 }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        />
                        {autoRefreshLabel}
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
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                <span>Son güncelleme: {lastUpdatedLabel}</span>
                <span>{requestsQuery.isFetching ? "Liste yenileniyor..." : "Liste güncel"}</span>
            </div>

            <SupplierApprovalRequestFilters
                search={filters.search}
                status={filters.status}
                type={filters.type}
                limit={filters.limit}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onSearchChange={setSearch}
                onStatusChange={setStatus}
                onTypeChange={setType}
                onLimitChange={setLimit}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
            />

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Talep</TableHead>
                            <TableHead>Tedarikçi</TableHead>
                            <TableHead>Oluşturan</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="pr-4 text-right">Tarih</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requestsQuery.isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-12">
                                    <div className="flex items-center justify-center">
                                        <Spinner className="size-5" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : requests.map((request) => {
                            const isExpanded = uiState.expandedId === request.id
                            const currentSnapshot = request.currentSnapshot ?? {}
                            const requestedPayload = request.requestPayload ?? {}

                            return (
                                <Fragment key={request.id}>
                                    <TableRow className={isExpanded ? "bg-neutral-50/70" : undefined}>
                                        <TableCell>
                                            <button
                                                type="button"
                                                className="flex items-center gap-2 text-left"
                                                onClick={() => dispatch({ type: "toggleExpanded", id: request.id })}
                                            >
                                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                                <div>
                                                    <div className="font-medium">
                                                        {SUPPLIER_APPROVAL_TYPE_LABELS[request.type] ?? request.type}
                                                    </div>
                                                    <div className="text-xs text-neutral-500">{getTargetLabel(request)}</div>
                                                </div>
                                            </button>
                                        </TableCell>
                                        <TableCell>{request.supplier.name}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">{request.requestedByUser.email}</div>
                                            <div className="text-xs text-neutral-500">{request.requestedByUser.identifier}</div>
                                        </TableCell>
                                        <TableCell>
                                            <SupplierApprovalRequestStatusBadge status={request.status} />
                                        </TableCell>
                                        <TableCell className="pr-4 text-right text-sm text-neutral-500">
                                            {new Date(request.createdAt).toLocaleDateString("tr-TR")}
                                        </TableCell>
                                    </TableRow>

                                    {isExpanded ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="bg-white p-4">
                                                <div className="grid gap-4 lg:grid-cols-2">
                                                    <div className="rounded-xl border border-neutral-200 p-4">
                                                        <h3 className="mb-3 text-sm font-semibold text-neutral-900">Mevcut Değerler</h3>
                                                        <div className="space-y-2 text-sm">
                                                            {Object.entries(currentSnapshot).map(([key, value]) => (
                                                                <div key={`${request.id}-current-${key}`} className="flex justify-between gap-3 border-b border-dashed border-neutral-100 pb-2 last:border-0 last:pb-0">
                                                                    <span className="text-neutral-500">{FIELD_LABELS[key] ?? key}</span>
                                                                    <span className="text-right text-neutral-900">{renderValue(value)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="rounded-xl border border-neutral-200 p-4">
                                                        <h3 className="mb-3 text-sm font-semibold text-neutral-900">Talep Edilen Değerler</h3>
                                                        <div className="space-y-2 text-sm">
                                                            {Object.entries(requestedPayload).map(([key, value]) => (
                                                                <div key={`${request.id}-requested-${key}`} className="flex justify-between gap-3 border-b border-dashed border-neutral-100 pb-2 last:border-0 last:pb-0">
                                                                    <span className="text-neutral-500">{FIELD_LABELS[key] ?? key}</span>
                                                                    <span className="text-right text-neutral-900">{renderValue(value)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 space-y-3">
                                                    {request.decisionNote ? (
                                                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                                                            Son karar notu: {request.decisionNote}
                                                        </div>
                                                    ) : null}

                                                    {request.status === "PENDING" ? (
                                                        <>
                                                            <Textarea
                                                                placeholder="İsteğe dair not ekleyin (opsiyonel)"
                                                                value={uiState.noteById[request.id] ?? ""}
                                                                onChange={(e) =>
                                                                    dispatch({
                                                                        type: "setNote",
                                                                        id: request.id,
                                                                        note: e.target.value,
                                                                    })
                                                                }
                                                            />

                                                            <div className="flex flex-wrap justify-end gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    className="gap-2"
                                                                    disabled={decideMutation.isPending}
                                                                    onClick={() => void handleDecision(request, false)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                    Reddet
                                                                </Button>
                                                                <Button
                                                                    className="gap-2"
                                                                    disabled={decideMutation.isPending}
                                                                    onClick={() => void handleDecision(request, true)}
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                    Onayla
                                                                </Button>
                                                            </div>
                                                        </>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : null}
                                </Fragment>
                            )
                        })}

                        {!requestsQuery.isLoading && requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-10 text-center text-sm text-neutral-500">
                                    Onay talebi bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : null}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={(meta?.page ?? filters.page) <= 1}
                    onClick={() => setPage(Math.max(1, filters.page - 1))}
                >
                    Önceki
                </Button>
                <span className="text-sm text-neutral-600">
                    Sayfa {meta?.page ?? filters.page} / {meta?.totalPages ?? 1}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={(meta?.page ?? filters.page) >= (meta?.totalPages ?? 1)}
                    onClick={() => setPage(filters.page + 1)}
                >
                    Sonraki
                </Button>
            </div>
        </div>
    )
}
