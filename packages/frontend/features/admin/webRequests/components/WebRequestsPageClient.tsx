"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { motion } from "motion/react"
import { ChevronDown, Loader2, Save, Search } from "lucide-react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { AdminWebRequest, AdminWebRequestItem, AdminWebRequestItemResolved } from "@/features/admin/webRequests/api/types"
import { getWebRequestItemDetails } from "@/features/admin/webRequests/api/getWebRequestItemDetails"
import { useWebRequests } from "@/features/admin/webRequests/hooks/useWebRequests"
import { useUpdateWebRequestStatus } from "@/features/admin/webRequests/hooks/useUpdateWebRequestStatus"

const STATUS_OPTIONS = ["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED"] as const
const EMPTY_REQUESTS: AdminWebRequest[] = []
const STATUS_LABELS: Record<string, string> = {
    NEW: "Yeni",
    CONTACTED: "İletişime Geçildi",
    IN_PROGRESS: "İşlemde",
    CLOSED: "Kapatıldı",
}

function parseRequestItems(items: unknown): AdminWebRequestItem[] {
    if (!Array.isArray(items)) return []
    return items
        .map((item) => item as AdminWebRequestItem)
        .filter((item) => Boolean(item?.productId) && Boolean(item?.variantKey))
}

export function WebRequestsPageClient() {
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [statusById, setStatusById] = useState<Record<string, "NEW" | "CONTACTED" | "IN_PROGRESS" | "CLOSED">>({})
    const [detailsById, setDetailsById] = useState<Record<string, AdminWebRequestItemResolved[]>>({})
    const [loadingDetailsById, setLoadingDetailsById] = useState<Record<string, boolean>>({})

    const params = useMemo(
        () => ({
            page,
            limit,
            ...(search.trim() ? { search: search.trim() } : {}),
            ...(status ? { status } : {}),
        }),
        [page, limit, search, status]
    )

    const webRequestsQuery = useWebRequests(params)
    const updateStatusMutation = useUpdateWebRequestStatus()
    const webRequests = webRequestsQuery.data?.data ?? EMPTY_REQUESTS
    const meta = webRequestsQuery.data?.meta

    useEffect(() => {
        const next: Record<string, "NEW" | "CONTACTED" | "IN_PROGRESS" | "CLOSED"> = {}
        for (const request of webRequests) {
            const normalized = request.status?.toUpperCase() as "NEW" | "CONTACTED" | "IN_PROGRESS" | "CLOSED"
            if (STATUS_OPTIONS.includes(normalized)) {
                next[request.id] = normalized
            } else {
                next[request.id] = "NEW"
            }
        }
        setStatusById((prev) => {
            const prevKeys = Object.keys(prev)
            const nextKeys = Object.keys(next)
            if (prevKeys.length !== nextKeys.length) return next
            for (const key of nextKeys) {
                if (prev[key] !== next[key]) return next
            }
            return prev
        })
    }, [webRequests])

    async function toggleDetails(request: AdminWebRequest) {
        const nextOpen = expandedId === request.id ? null : request.id
        setExpandedId(nextOpen)

        if (!nextOpen) return
        if (detailsById[request.id]) return

        const items = parseRequestItems(request.items)
        if (items.length === 0) {
            setDetailsById((prev) => ({ ...prev, [request.id]: [] }))
            return
        }

        setLoadingDetailsById((prev) => ({ ...prev, [request.id]: true }))
        try {
            const resolved = await getWebRequestItemDetails(items)
            setDetailsById((prev) => ({ ...prev, [request.id]: resolved }))
        } catch (error) {
            console.error(error)
            toast.error("Sepet detayları yüklenemedi.")
        } finally {
            setLoadingDetailsById((prev) => ({ ...prev, [request.id]: false }))
        }
    }

    async function handleSaveStatus(request: AdminWebRequest) {
        const nextStatus = statusById[request.id]
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

            <div className="grid gap-3 lg:grid-cols-4">
                <div className="relative lg:col-span-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                        placeholder="Ad, e-posta, telefon, mesaj içinde ara"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="pl-9"
                    />
                </div>

                <select
                    className="h-10 rounded-md border border-neutral-200 px-3 text-sm"
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value)
                        setPage(1)
                    }}
                >
                    <option value="">Tüm Durumlar</option>
                    {STATUS_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                            {STATUS_LABELS[value]}
                        </option>
                    ))}
                </select>
            </div>

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
                            const isExpanded = expandedId === request.id
                            const items = parseRequestItems(request.items)
                            const resolvedItems = detailsById[request.id] ?? []
                            const isDetailsLoading = loadingDetailsById[request.id]
                            const selectedStatus = statusById[request.id] ?? "NEW"

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
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="h-8 rounded-md border border-neutral-200 px-2 text-xs"
                                                    value={selectedStatus}
                                                    onChange={(e) =>
                                                        setStatusById((prev) => ({
                                                            ...prev,
                                                            [request.id]: e.target.value as "NEW" | "CONTACTED" | "IN_PROGRESS" | "CLOSED",
                                                        }))
                                                    }
                                                >
                                                    {STATUS_OPTIONS.map((value) => (
                                                        <option key={value} value={value}>
                                                            {STATUS_LABELS[value]}
                                                        </option>
                                                    ))}
                                                </select>
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

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={(meta?.page ?? page) <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                    Önceki
                </Button>
                <span className="text-sm text-neutral-600">
                    Sayfa {meta?.page ?? page} / {meta?.totalPages ?? 1}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={(meta?.page ?? page) >= (meta?.totalPages ?? 1)}
                    onClick={() => setPage((p) => p + 1)}
                >
                    Sonraki
                </Button>
                <select
                    className="ml-2 h-8 rounded-md border border-neutral-200 px-2 text-sm"
                    value={String(limit)}
                    onChange={(e) => {
                        setLimit(Number(e.target.value))
                        setPage(1)
                    }}
                >
                    <option value="10">10 / sayfa</option>
                    <option value="20">20 / sayfa</option>
                    <option value="50">50 / sayfa</option>
                </select>
            </div>

            {webRequestsQuery.isFetching && !webRequestsQuery.isLoading && (
                <div className="inline-flex items-center gap-2 text-sm text-neutral-500">
                    <Spinner className="size-4" />
                    Liste güncelleniyor...
                </div>
            )}
        </div>
    )
}
