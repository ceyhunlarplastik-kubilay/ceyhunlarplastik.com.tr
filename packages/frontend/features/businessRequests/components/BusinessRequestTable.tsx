"use client"

import { Fragment, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Check, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    APPROVAL_ROLE_LABELS,
    APPROVAL_STEP_STATUS_LABELS,
    BUSINESS_REQUEST_DOMAIN_LABELS,
    BUSINESS_REQUEST_PRIORITY_LABELS,
    BUSINESS_REQUEST_TYPE_LABELS,
} from "@/features/businessRequests/config"
import { BusinessRequestDiffPanel } from "@/features/businessRequests/components/BusinessRequestDiffPanel"
import { BusinessRequestStatusBadge } from "@/features/businessRequests/components/BusinessRequestStatusBadge"
import type {
    ApprovalRole,
    BusinessRequest,
    BusinessRequestDecisionAction,
    BusinessRequestDecisionScope,
} from "@/features/businessRequests/api/types"
import { getUserDisplayName } from "@/lib/users/displayName"

type Props = {
    requests: BusinessRequest[]
    isLoading?: boolean
    emptyMessage: string
    showRequester?: boolean
    showDomain?: boolean
    decisionScope?: BusinessRequestDecisionScope
    onDecision?: (input: {
        scope: BusinessRequestDecisionScope
        id: string
        action?: BusinessRequestDecisionAction
        approved?: boolean
        note?: string
        counterOfferItems?: Array<{
            requestItemId: string
            proposedUnitPrice: number
            currency?: string | null
        }>
    }) => Promise<unknown>
    isDecisionPending?: boolean
}

function getCurrentPendingStep(request: BusinessRequest) {
    return request.approvalSteps?.find((step) => step.status === "PENDING") ?? null
}

function isSupplierDiffRequest(request: BusinessRequest) {
    return request.type === "SUPPLIER_PROFILE_CHANGE"
        || request.type === "SUPPLIER_PRICING_CHANGE"
        || request.type === "SUPPLIER_CATEGORY_CREATE"
        || request.type === "SUPPLIER_PRODUCT_CREATE"
        || request.type === "SUPPLIER_VARIANT_CREATE"
}

function isDiffRequest(request: BusinessRequest) {
    return isSupplierDiffRequest(request) || request.type === "CUSTOMER_PROFILE_CHANGE"
}

function getSubjectLabel(request: BusinessRequest) {
    if (request.customer) return request.customer.companyName || request.customer.fullName
    if (request.supplier) return request.supplier.name
    if ((request.items?.length ?? 0) > 0) {
        return `${request.items?.length ?? 0} varyant satırı`
    }
    return request.entityType || "-"
}

function canCurrentUserDecideRequest(
    request: BusinessRequest,
    user: { dbUserId?: string | null; customerId?: string | null; groups?: string[] } | undefined,
) {
    const currentStep = getCurrentPendingStep(request)
    if (!currentStep || !user) return false

    const groups = user.groups ?? []
    const dbUserId = user.dbUserId ?? undefined

    if (groups.includes("owner") || groups.includes("admin")) return true

    if (groups.includes("customer")) {
        return currentStep.requiredRole === "CUSTOMER" && request.customerId === user.customerId
    }

    if (request.domain === "SALES") {
        if (groups.includes("sales_director")) {
            return currentStep.requiredRole === "SALES" || currentStep.requiredRole === "SALES_DIRECTOR"
        }

        if (groups.includes("sales")) {
            return (
                currentStep.requiredRole === "SALES"
                && (!currentStep.assignedUserId || currentStep.assignedUserId === dbUserId)
                && (!request.customer?.assignedSalesUserId || request.customer.assignedSalesUserId === dbUserId)
            )
        }
    }

    if (request.domain === "PURCHASING" && groups.includes("purchasing")) {
        return (
            currentStep.requiredRole === "PURCHASING"
            && (!currentStep.assignedUserId || currentStep.assignedUserId === dbUserId)
            && (request.supplier?.assignedPurchasingSuppliers ?? []).some((assignedUser) => assignedUser.id === dbUserId)
        )
    }

    return false
}

function renderDataValue(value: unknown) {
    if (value === null || value === undefined || value === "") return "-"
    if (Array.isArray(value)) return value.join(", ")
    if (typeof value === "boolean") return value ? "Evet" : "Hayır"
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
}

function formatDateValue(value: unknown) {
    if (typeof value !== "string" || !value) return "-"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return new Intl.DateTimeFormat("tr-TR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date)
}

function formatMoneyValue(value: unknown, currency = "TRY") {
    if (typeof value !== "number" || !Number.isFinite(value)) return "-"

    try {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(value)
    } catch {
        return `${value.toFixed(2)} ${currency}`
    }
}

function getDocumentTypeLabel(value: string) {
    const labels: Record<string, string> = {
        TECHNICAL_DRAWING: "Teknik Çizim",
        CERTIFICATE: "Sertifika",
        CATALOG: "Katalog",
        TEST_REPORT: "Test Raporu",
        MATERIAL_DECLARATION: "Malzeme Beyanı",
        THREE_D_MODEL: "3D Model",
        OTHER: "Diğer",
    }

    return labels[value] ?? value
}

function getRequestDataHighlights(request: BusinessRequest) {
    const data = request.requestedData ?? {}

    switch (request.type) {
        case "CUSTOMER_PROFILE_CHANGE": {
            const profile = data.proposedProfile as Record<string, unknown> | undefined
            const addresses = Array.isArray(profile?.addresses) ? profile?.addresses : []

            return [
                { label: "Firma", value: renderDataValue(profile?.companyName) },
                { label: "Yetkili", value: renderDataValue(profile?.fullName) },
                { label: "Telefon", value: renderDataValue(profile?.phone) },
                { label: "E-posta", value: renderDataValue(profile?.email) },
                { label: "Adres Talebi", value: addresses.length > 0 ? `${addresses.length} kayıt` : "-" },
            ]
        }
        case "CUSTOMER_ORDER_REQUEST":
            return [
                { label: "Teslim Tarihi", value: formatDateValue(data.requestedDeliveryDate) },
                { label: "Sevkiyat Adresi", value: renderDataValue(data.shippingAddressLabel) },
                { label: "Müşteri Referansı", value: renderDataValue(data.referenceCode) },
                { label: "Kalem", value: renderDataValue(data.draftItemCount) },
                { label: "Toplam Adet", value: renderDataValue(data.draftQuantity) },
            ]
        case "CUSTOMER_DOCUMENT_REQUEST":
            return [
                {
                    label: "Döküman Tipleri",
                    value: Array.isArray(data.documentTypes)
                        ? data.documentTypes.map((item) => getDocumentTypeLabel(String(item))).join(", ")
                        : "-",
                },
                { label: "Format", value: renderDataValue(data.documentFormat) },
                { label: "Ürün Referansı", value: renderDataValue(data.productReference) },
                { label: "Varyant Referansı", value: renderDataValue(data.variantReference) },
                { label: "İhtiyaç Tarihi", value: formatDateValue(data.neededAt) },
            ]
        case "CUSTOMER_PRICING_REQUEST":
            return [
                { label: "Teklif Tarihi", value: formatDateValue(data.quoteNeededAt) },
                { label: "Talep Nedeni", value: renderDataValue(data.pricingReason) },
                { label: "Ticari Beklenti", value: renderDataValue(data.pricingExpectation) },
                { label: "Müşteri Referansı", value: renderDataValue(data.referenceCode) },
                { label: "Kalem", value: renderDataValue(data.draftItemCount) },
            ]
        default:
            return Object.entries(data).map(([key, value]) => ({
                label: key,
                value: renderDataValue(value),
            }))
    }
}

function getRequestDataNotes(request: BusinessRequest) {
    const data = request.requestedData ?? {}
    const notes: Array<{ label: string; value: string }> = []

    if (typeof data.commercialNote === "string" && data.commercialNote.trim()) {
        notes.push({ label: "Ticari Not", value: data.commercialNote })
    }

    if (typeof data.negotiationNote === "string" && data.negotiationNote.trim()) {
        notes.push({ label: "Pazarlık Notu", value: data.negotiationNote })
    }

    const latestCounterOffer = typeof data.latestCounterOffer === "object" && data.latestCounterOffer
        ? data.latestCounterOffer as Record<string, unknown>
        : null
    if (typeof latestCounterOffer?.note === "string" && latestCounterOffer.note.trim()) {
        notes.push({ label: "Karşı Teklif Notu", value: latestCounterOffer.note })
    }

    if (typeof data.documentPurpose === "string" && data.documentPurpose.trim()) {
        notes.push({ label: "Talep Amacı", value: data.documentPurpose })
    }

    if (request.type === "CUSTOMER_PROFILE_CHANGE") {
        const profile = data.proposedProfile as Record<string, unknown> | undefined
        if (typeof profile?.note === "string" && profile.note.trim()) {
            notes.push({ label: "Profil Notu", value: profile.note })
        }
    }

    return notes
}

function renderRoleBadge(role: ApprovalRole, status?: string) {
    const variants: Record<string, "secondary" | "outline" | "default" | "destructive"> = {
        PENDING: "secondary",
        APPROVED: "default",
        REJECTED: "destructive",
        SKIPPED: "outline",
    }

    return (
        <Badge variant={variants[status ?? "SKIPPED"] ?? "outline"}>
            {APPROVAL_ROLE_LABELS[role]}
            {status ? ` • ${APPROVAL_STEP_STATUS_LABELS[status as keyof typeof APPROVAL_STEP_STATUS_LABELS]}` : ""}
        </Badge>
    )
}

export function BusinessRequestTable({
    requests,
    isLoading = false,
    emptyMessage,
    showRequester = true,
    showDomain = false,
    decisionScope,
    onDecision,
    isDecisionPending = false,
}: Props) {
    const { data: session } = useSession()
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [noteById, setNoteById] = useState<Record<string, string>>({})
    const [counterByRequestId, setCounterByRequestId] = useState<Record<string, Record<string, string>>>({})
    const [showAllFieldsById, setShowAllFieldsById] = useState<Record<string, boolean>>({})

    const userContext = useMemo(
        () => ({
            dbUserId: session?.user?.dbUserId ?? null,
            customerId: session?.user?.customerId ?? null,
            groups: session?.user?.groups ?? [],
        }),
        [session?.user?.customerId, session?.user?.dbUserId, session?.user?.groups],
    )

    return (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Talep</TableHead>
                        {showDomain ? <TableHead>Domain</TableHead> : null}
                        <TableHead>İlgili Kayıt</TableHead>
                        {showRequester ? <TableHead>Talebi Açan</TableHead> : null}
                        <TableHead>Durum</TableHead>
                        <TableHead>Bekleyen Adım</TableHead>
                        <TableHead className="pr-4 text-right">Tarih</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={showDomain ? (showRequester ? 7 : 6) : (showRequester ? 6 : 5)} className="py-12">
                                <div className="flex items-center justify-center">
                                    <Spinner className="size-5" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : requests.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={showDomain ? (showRequester ? 7 : 6) : (showRequester ? 6 : 5)}
                                className="py-12 text-center text-sm text-neutral-500"
                            >
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : requests.map((request) => {
                        const isExpanded = expandedId === request.id
                        const currentStep = getCurrentPendingStep(request)
                        const canDecide = decisionScope && onDecision
                            ? canCurrentUserDecideRequest(request, userContext)
                            : false
                        const canCounter = canDecide
                            && request.domain === "SALES"
                            && (request.type === "CUSTOMER_ORDER_REQUEST" || request.type === "CUSTOMER_PRICING_REQUEST")
                            && !userContext.groups?.includes("customer")
                            && (request.items?.length ?? 0) > 0

                        const counterValues = counterByRequestId[request.id] ?? {}

                        return (
                            <Fragment key={request.id}>
                                <TableRow className={isExpanded ? "bg-neutral-50/70" : undefined}>
                                    <TableCell>
                                        <button
                                            type="button"
                                            onClick={() => setExpandedId(isExpanded ? null : request.id)}
                                            className="flex items-start gap-2 text-left"
                                        >
                                            <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                            <div className="space-y-1">
                                                <div className="font-medium text-neutral-900">
                                                    {BUSINESS_REQUEST_TYPE_LABELS[request.type]}
                                                </div>
                                                <div className="line-clamp-2 text-xs text-neutral-500">
                                                    {request.title}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="outline">{BUSINESS_REQUEST_PRIORITY_LABELS[request.priority]}</Badge>
                                                </div>
                                            </div>
                                        </button>
                                    </TableCell>
                                    {showDomain ? (
                                        <TableCell>{BUSINESS_REQUEST_DOMAIN_LABELS[request.domain]}</TableCell>
                                    ) : null}
                                    <TableCell>
                                        <div className="text-sm text-neutral-900">{getSubjectLabel(request)}</div>
                                        {(request.items?.length ?? 0) > 0 ? (
                                            <div className="text-xs text-neutral-500">{request.items?.length} kalem eklendi</div>
                                        ) : null}
                                    </TableCell>
                                    {showRequester ? (
                                        <TableCell>
                                            <div className="text-sm text-neutral-900">{getUserDisplayName(request.requestedByUser) || request.requestedByUser.email}</div>
                                            <div className="text-xs text-neutral-500">{request.requestedByUser.email}</div>
                                        </TableCell>
                                    ) : null}
                                    <TableCell>
                                        <BusinessRequestStatusBadge status={request.status} />
                                    </TableCell>
                                    <TableCell>
                                        {currentStep ? renderRoleBadge(currentStep.requiredRole, currentStep.status) : "-"}
                                    </TableCell>
                                    <TableCell className="pr-4 text-right text-sm text-neutral-500">
                                        {new Date(request.createdAt).toLocaleString("tr-TR")}
                                    </TableCell>
                                </TableRow>

                                {isExpanded ? (
                                    <TableRow>
                                        <TableCell colSpan={showDomain ? (showRequester ? 7 : 6) : (showRequester ? 6 : 5)} className="bg-white p-4">
                                            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
                                                <div className="space-y-4">
                                                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                                                        <div className="text-sm font-medium text-neutral-900">Talep Detayı</div>
                                                        <p className="mt-2 text-sm leading-6 text-neutral-600">
                                                            {request.description?.trim() || "Açıklama girilmedi."}
                                                        </p>
                                                    </div>

                                                    {Object.entries(request.requestedData ?? {}).length > 0 ? (
                                                        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                                                            <div className="text-sm font-medium text-neutral-900">Talep Verileri</div>
                                                            {isDiffRequest(request) ? (
                                                                <div className="mt-3">
                                                                    <BusinessRequestDiffPanel
                                                                        request={request}
                                                                        showAllFields={Boolean(showAllFieldsById[request.id])}
                                                                        onToggleShowAll={() =>
                                                                            setShowAllFieldsById((current) => ({
                                                                                ...current,
                                                                                [request.id]: !current[request.id],
                                                                            }))
                                                                        }
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                                        {getRequestDataHighlights(request).map(({ label, value }) => (
                                                                            <div key={label} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                                                                                <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">{label}</div>
                                                                                <div className="mt-1 text-sm text-neutral-700">{value}</div>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {getRequestDataNotes(request).length > 0 ? (
                                                                        <div className="mt-4 grid gap-3">
                                                                            {getRequestDataNotes(request).map(({ label, value }) => (
                                                                                <div key={label} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                                                                                    <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">{label}</div>
                                                                                    <div className="mt-1 text-sm leading-6 text-neutral-700">{value}</div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : null}

                                                                </>
                                                            )}
                                                        </div>
                                                    ) : null}

                                                    {(request.items?.length ?? 0) > 0 ? (
                                                        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                                                            <div className="text-sm font-medium text-neutral-900">Talep Kalemleri</div>
                                                            <div className="mt-3 grid gap-3">
                                                                {request.items?.map((item) => (
                                                                    <div key={item.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                                                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                                                            <div>
                                                                                <div className="font-medium text-neutral-900">
                                                                                    {item.productVariant?.product?.name ?? "Varyant kalemi"}
                                                                                </div>
                                                                                <div className="text-xs text-neutral-500">
                                                                                    {item.productVariant?.fullCode
                                                                                        ?? (typeof item.data?.variantFullCode === "string"
                                                                                            ? item.data.variantFullCode
                                                                                            : typeof item.data?.variantKey === "string"
                                                                                                ? item.data.variantKey
                                                                                                : "-")}
                                                                                </div>
                                                                            </div>
                                                                            <Badge variant="outline">Adet: {item.quantity}</Badge>
                                                                        </div>
                                                                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                                            <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">
                                                                                <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">Liste Fiyatı</span>
                                                                                <div className="mt-1 font-medium text-neutral-900">
                                                                                    {formatMoneyValue(item.data?.listUnitPrice, typeof item.data?.currency === "string" ? item.data.currency : "TRY")}
                                                                                </div>
                                                                            </div>
                                                                            <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">
                                                                                <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">Talep Edilen Fiyat</span>
                                                                                <div className="mt-1 font-medium text-neutral-900">
                                                                                    {formatMoneyValue(item.data?.targetUnitPrice, typeof item.data?.currency === "string" ? item.data.currency : "TRY")}
                                                                                </div>
                                                                            </div>
                                                                            {typeof item.data?.customerUnitPrice === "number" ? (
                                                                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 md:col-span-2">
                                                                                    <span className="text-[11px] uppercase tracking-[0.16em] text-emerald-600">Müşteri Net Fiyatı</span>
                                                                                    <div className="mt-1 font-medium">
                                                                                        {formatMoneyValue(item.data?.customerUnitPrice, typeof item.data?.currency === "string" ? item.data.currency : "TRY")}
                                                                                    </div>
                                                                                    {typeof item.data?.appliedDiscountPercent === "number" && item.data.appliedDiscountPercent > 0 ? (
                                                                                        <div className="mt-1 text-[11px] text-emerald-700">
                                                                                            %{item.data.appliedDiscountPercent.toLocaleString("tr-TR", {
                                                                                                minimumFractionDigits: item.data.appliedDiscountPercent % 1 === 0 ? 0 : 2,
                                                                                                maximumFractionDigits: 2,
                                                                                            })} genel iskonto uygulandı
                                                                                        </div>
                                                                                    ) : null}
                                                                                </div>
                                                                            ) : null}
                                                                            {typeof item.data?.counterUnitPrice === "number" ? (
                                                                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                                                                    <span className="text-[11px] uppercase tracking-[0.16em] text-amber-500">Karşı Teklif</span>
                                                                                    <div className="mt-1 font-medium">
                                                                                        {formatMoneyValue(item.data?.counterUnitPrice, typeof item.data?.counterCurrency === "string" ? item.data.counterCurrency : (typeof item.data?.currency === "string" ? item.data.currency : "TRY"))}
                                                                                    </div>
                                                                                </div>
                                                                            ) : null}
                                                                        </div>
                                                                        {item.note ? (
                                                                            <div className="mt-2 text-xs text-neutral-600">{item.note}</div>
                                                                        ) : null}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                                                        <div className="text-sm font-medium text-neutral-900">Onay Akışı</div>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {request.approvalSteps?.map((step) => (
                                                                <div key={step.id} className="space-y-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                                                                    <div>{renderRoleBadge(step.requiredRole, step.status)}</div>
                                                                    <div className="text-xs text-neutral-500">
                                                                        {step.assignedUser
                                                                            ? (getUserDisplayName(step.assignedUser) || step.assignedUser.email)
                                                                            : "Rol bazlı"}
                                                                    </div>
                                                                    {step.decisionNote ? (
                                                                        <div className="max-w-[240px] text-xs text-neutral-600">{step.decisionNote}</div>
                                                                    ) : null}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {(request.activityLogs?.length ?? 0) > 0 ? (
                                                        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                                                            <div className="text-sm font-medium text-neutral-900">Aktivite Akışı</div>
                                                            <div className="mt-3 space-y-3">
                                                                {request.activityLogs?.slice(0, 5).map((log) => (
                                                                    <div key={log.id} className="border-l border-neutral-200 pl-3">
                                                                        <div className="text-sm font-medium text-neutral-900">{log.title}</div>
                                                                        {log.description ? (
                                                                            <div className="mt-1 text-xs leading-5 text-neutral-600">{log.description}</div>
                                                                        ) : null}
                                                                        <div className="mt-1 text-[11px] text-neutral-400">
                                                                            {new Date(log.createdAt).toLocaleString("tr-TR")}
                                                                            {log.actorUser
                                                                                ? ` • ${getUserDisplayName(log.actorUser) || log.actorUser.email}`
                                                                                : ""}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : null}

                                                    {decisionScope && onDecision && canDecide ? (
                                                        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                                                            <div className="text-sm font-medium text-neutral-900">Karar Ver</div>
                                                            {canCounter ? (
                                                                <div className="mt-3 space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                                                                    <div className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
                                                                        Karşı Teklif Fiyatları
                                                                    </div>
                                                                    {request.items?.map((item) => (
                                                                        <div key={`${request.id}-${item.id}`} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_140px] md:items-center">
                                                                            <div>
                                                                                <div className="text-sm font-medium text-neutral-900">
                                                                                    {item.productVariant?.product?.name ?? "Varyant kalemi"}
                                                                                </div>
                                                                                <div className="text-xs text-neutral-500">
                                                                                    {item.productVariant?.fullCode
                                                                                        ?? (typeof item.data?.variantFullCode === "string"
                                                                                            ? item.data.variantFullCode
                                                                                            : typeof item.data?.variantKey === "string"
                                                                                                ? item.data.variantKey
                                                                                                : "-")}
                                                                                </div>
                                                                            </div>
                                                                            <Input
                                                                                inputMode="decimal"
                                                                                placeholder={typeof item.data?.counterUnitPrice === "number"
                                                                                    ? String(item.data.counterUnitPrice)
                                                                                    : typeof item.data?.targetUnitPrice === "number"
                                                                                        ? String(item.data.targetUnitPrice)
                                                                                        : "0"}
                                                                                value={counterValues[item.id] ?? ""}
                                                                                onChange={(event) =>
                                                                                    setCounterByRequestId((current) => ({
                                                                                        ...current,
                                                                                        [request.id]: {
                                                                                            ...(current[request.id] ?? {}),
                                                                                            [item.id]: event.target.value,
                                                                                        },
                                                                                    }))
                                                                                }
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : null}
                                                            <Textarea
                                                                value={noteById[request.id] ?? ""}
                                                                onChange={(event) =>
                                                                    setNoteById((current) => ({
                                                                        ...current,
                                                                        [request.id]: event.target.value,
                                                                    }))
                                                                }
                                                                rows={4}
                                                                className="mt-3"
                                                                placeholder="Karar notu"
                                                            />
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <Button
                                                                    type="button"
                                                                    disabled={isDecisionPending}
                                                                    onClick={() =>
                                                                        void onDecision({
                                                                            scope: decisionScope,
                                                                            id: request.id,
                                                                            approved: true,
                                                                            note: noteById[request.id]?.trim() || undefined,
                                                                        })
                                                                    }
                                                                >
                                                                    <Check className="mr-2 h-4 w-4" />
                                                                    Onayla
                                                                </Button>
                                                                {canCounter ? (
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        disabled={isDecisionPending}
                                                                        onClick={() => {
                                                                            const counterOfferItems = (request.items ?? [])
                                                                                .map((item) => ({
                                                                                    constValue: counterValues[item.id]?.trim()
                                                                                        || (typeof item.data?.counterUnitPrice === "number"
                                                                                            ? String(item.data.counterUnitPrice)
                                                                                            : typeof item.data?.targetUnitPrice === "number"
                                                                                                ? String(item.data.targetUnitPrice)
                                                                                                : ""),
                                                                                    requestItemId: item.id,
                                                                                    proposedUnitPrice: 0,
                                                                                    currency: typeof item.data?.currency === "string" ? item.data.currency : "TRY",
                                                                                }))
                                                                                .map((item) => ({
                                                                                    requestItemId: item.requestItemId,
                                                                                    proposedUnitPrice: Number.parseFloat(item.constValue.replace(",", ".")),
                                                                                    currency: item.currency,
                                                                                }))
                                                                                .filter((item) => Number.isFinite(item.proposedUnitPrice) && item.proposedUnitPrice > 0)

                                                                            if (counterOfferItems.length === 0) return

                                                                            void onDecision({
                                                                                scope: decisionScope,
                                                                                id: request.id,
                                                                                action: "COUNTER",
                                                                                note: noteById[request.id]?.trim() || undefined,
                                                                                counterOfferItems,
                                                                            })
                                                                        }}
                                                                    >
                                                                        Karşı Teklif Gönder
                                                                    </Button>
                                                                ) : null}
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    disabled={isDecisionPending}
                                                                    onClick={() =>
                                                                        void onDecision({
                                                                            scope: decisionScope,
                                                                            id: request.id,
                                                                            action: "REJECT",
                                                                            approved: false,
                                                                            note: noteById[request.id]?.trim() || undefined,
                                                                        })
                                                                    }
                                                                >
                                                                    <X className="mr-2 h-4 w-4" />
                                                                    Reddet
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </Fragment>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
