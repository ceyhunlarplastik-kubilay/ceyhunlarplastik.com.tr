"use client"

import { useDeferredValue, useMemo, useState } from "react"
import {
    Building2,
    ChevronDown,
    Loader2,
    Mail,
    Phone,
    Plus,
    RefreshCcw,
    Search,
    Target,
    UserPlus,
    X,
} from "lucide-react"
import { toast } from "sonner"

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
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import type { LeadCustomer } from "@/features/admin/leadCustomers/api/types"
import { useLeadCustomers } from "@/features/admin/leadCustomers/hooks/useLeadCustomers"
import { LeadCustomerDetailPanel } from "./LeadCustomerDetailPanel"
import { LeadCustomerProfileDialog } from "./LeadCustomerProfileDialog"

const ALL_VALUE = "__all__"

type Props = {
    workspaceLabel: string
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("tr-TR").format(value)
}

function LeadCustomerCard({
    customer,
    isExpanded,
    autoOpenAddress,
    onAutoOpenAddressConsumed,
    onToggle,
    onEdit,
}: {
    customer: LeadCustomer
    isExpanded: boolean
    autoOpenAddress: boolean
    onAutoOpenAddressConsumed: () => void
    onToggle: () => void
    onEdit: () => void
}) {
    const usageAreaCount = customer.usageAreaValues.length
    const hasProfile = Boolean(customer.sectorValue) || usageAreaCount > 0

    return (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-neutral-950">
                            {customer.companyName || customer.fullName}
                        </span>
                        {customer.companyName ? (
                            <span className="text-sm text-neutral-500">{customer.fullName}</span>
                        ) : null}
                        {!hasProfile ? (
                            <Badge
                                variant="outline"
                                className="rounded-full border-amber-200 bg-amber-50 text-[11px] font-medium text-amber-700"
                            >
                                profil atanmamış
                            </Badge>
                        ) : null}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {customer.email}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {customer.phone}
                        </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {customer.sectorValue ? (
                            <Badge variant="outline" className="rounded-full font-normal">
                                {customer.sectorValue.name}
                            </Badge>
                        ) : null}
                        {customer.productionGroupValue ? (
                            <Badge variant="outline" className="rounded-full font-normal">
                                {customer.productionGroupValue.name}
                            </Badge>
                        ) : null}
                        {customer.usageAreaValues.slice(0, 3).map((value) => (
                            <Badge
                                key={value.id}
                                variant="outline"
                                className="rounded-full border-brand/30 bg-brand/5 font-normal text-brand"
                            >
                                {value.name}
                            </Badge>
                        ))}
                        {usageAreaCount > 3 ? (
                            <span className="text-xs text-neutral-400">
                                +{usageAreaCount - 3} kullanım alanı
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="flex shrink-0 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl"
                        onClick={onToggle}
                    >
                        <Target className="h-4 w-4" />
                        Adresler & Eşleşen Ürünler
                        <ChevronDown
                            className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")}
                        />
                    </Button>
                    <Button type="button" className="rounded-2xl" onClick={onEdit}>
                        Profili Düzenle
                    </Button>
                </div>
            </div>

            {isExpanded ? (
                <div className="border-t border-neutral-100 bg-neutral-50/60 p-4">
                    <LeadCustomerDetailPanel
                        customerId={customer.id}
                        autoOpenAddress={autoOpenAddress}
                        onAutoOpenAddressConsumed={onAutoOpenAddressConsumed}
                    />
                </div>
            ) : null}
        </div>
    )
}

export function LeadCustomersPageClient({ workspaceLabel }: Props) {
    const [search, setSearch] = useState("")
    const [sectorValueId, setSectorValueId] = useState("")
    const [usageAreaValueId, setUsageAreaValueId] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    // Yeni kayıttan sonra adres formunun tek seferlik otomatik açılması.
    const [addressPromptId, setAddressPromptId] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<LeadCustomer | null>(null)

    const deferredSearch = useDeferredValue(search)
    const attributesQuery = useAttributesForFilter()

    const params = useMemo(
        () => ({
            page,
            limit,
            ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
            ...(sectorValueId ? { sectorValueId } : {}),
            ...(usageAreaValueId ? { usageAreaValueId } : {}),
        }),
        [deferredSearch, limit, page, sectorValueId, usageAreaValueId],
    )

    const leadsQuery = useLeadCustomers(params)
    const leads = leadsQuery.data?.data ?? []
    const meta = leadsQuery.data?.meta
    const isInitialLoading = leadsQuery.isLoading && leads.length === 0

    const sectorValues = useMemo(
        () => attributesQuery.data?.find((attribute) => attribute.code === "sector")?.values ?? [],
        [attributesQuery.data],
    )
    const usageAreaValues = useMemo(
        () => attributesQuery.data?.find((attribute) => attribute.code === "usage_area")?.values ?? [],
        [attributesQuery.data],
    )

    const withoutProfileCount = leads.filter(
        (lead) => !lead.sectorValue && lead.usageAreaValues.length === 0,
    ).length

    const hasFilters = Boolean(search.trim() || sectorValueId || usageAreaValueId)

    function clearFilters() {
        setSearch("")
        setSectorValueId("")
        setUsageAreaValueId("")
        setPage(1)
    }

    /**
     * Kayıttan sonra yeni kayıt MUTLAKA görünür olmalı: aktif filtre veya 2.
     * sayfa yüzünden kart hiç render edilmezse kullanıcıya "hiçbir şey olmadı"
     * gibi görünür. Bu yüzden filtreler temizlenir, ilk sayfaya dönülür,
     * kart açılır ve adres formu otomatik gelir.
     */
    function handleCreated(customerId: string) {
        setSearch("")
        setSectorValueId("")
        setUsageAreaValueId("")
        setPage(1)
        setExpandedId(customerId)
        setAddressPromptId(customerId)
    }

    function openCreateDialog() {
        setEditingCustomer(null)
        setDialogOpen(true)
    }

    function openEditDialog(customer: LeadCustomer) {
        setEditingCustomer(customer)
        setDialogOpen(true)
    }

    async function handleRefresh() {
        await leadsQuery.refetch()
        toast.success("Liste yenilendi")
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-brand px-5 py-6 text-white sm:px-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <Badge className="border-white/15 bg-white/10 text-white" variant="outline">
                                {workspaceLabel}
                            </Badge>
                            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                                Potansiyel Müşteriler
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base">
                                Potansiyel müşteriyi kaydedin ve ilgilendiği endüstriyel kullanım alanlarını atayın.
                                Atanan profil, müşterinin portalda göreceği &quot;İlgili Ürünler&quot; listesini belirler.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                                    Toplam
                                </div>
                                <div className="mt-1 text-xl font-semibold">
                                    {formatNumber(meta?.total ?? 0)}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                                    Profilsiz (bu sayfa)
                                </div>
                                <div className="mt-1 text-xl font-semibold">{withoutProfileCount}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-950">Kayıtlar</h2>
                        <p className="text-sm text-neutral-500">
                            Yalnız potansiyel müşteriler (LEAD) listelenir; cari müşteriler bu sekmede görünmez.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-2xl"
                            onClick={handleRefresh}
                            disabled={leadsQuery.isFetching}
                        >
                            {leadsQuery.isFetching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCcw className="h-4 w-4" />
                            )}
                            Yenile
                        </Button>
                        <Button type="button" className="rounded-2xl" onClick={openCreateDialog}>
                            <Plus className="h-4 w-4" />
                            Yeni Potansiyel Müşteri
                        </Button>
                    </div>
                </div>

                <Separator className="my-5" />

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_240px_auto] lg:items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value)
                                setPage(1)
                            }}
                            placeholder="Firma, yetkili, e-posta veya telefon ara"
                            className="h-11 rounded-2xl pl-9"
                        />
                    </div>

                    <Select
                        value={sectorValueId || ALL_VALUE}
                        onValueChange={(value) => {
                            setSectorValueId(value === ALL_VALUE ? "" : value)
                            setPage(1)
                        }}
                    >
                        <SelectTrigger className="h-11 w-full rounded-2xl">
                            <SelectValue placeholder="Sektör" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_VALUE}>Tüm sektörler</SelectItem>
                            {sectorValues.map((value) => (
                                <SelectItem key={value.id} value={value.id}>
                                    {value.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={usageAreaValueId || ALL_VALUE}
                        onValueChange={(value) => {
                            setUsageAreaValueId(value === ALL_VALUE ? "" : value)
                            setPage(1)
                        }}
                    >
                        <SelectTrigger className="h-11 w-full rounded-2xl">
                            <SelectValue placeholder="Kullanım alanı" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_VALUE}>Tüm kullanım alanları</SelectItem>
                            {usageAreaValues.map((value) => (
                                <SelectItem key={value.id} value={value.id}>
                                    {value.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {hasFilters ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl"
                            onClick={clearFilters}
                        >
                            <X className="h-4 w-4" />
                            Temizle
                        </Button>
                    ) : null}
                </div>
            </section>

            <div aria-busy={leadsQuery.isFetching} className="space-y-3">
                {isInitialLoading
                    ? Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-[132px] animate-pulse rounded-2xl border border-neutral-100 bg-neutral-50"
                        />
                    ))
                    : leads.map((customer) => (
                        <LeadCustomerCard
                            key={customer.id}
                            customer={customer}
                            isExpanded={expandedId === customer.id}
                            autoOpenAddress={addressPromptId === customer.id}
                            onAutoOpenAddressConsumed={() => setAddressPromptId(null)}
                            onToggle={() =>
                                setExpandedId((current) => (current === customer.id ? null : customer.id))
                            }
                            onEdit={() => openEditDialog(customer)}
                        />
                    ))}

                {!isInitialLoading && leads.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-neutral-200 bg-white px-6 py-14 text-center shadow-sm">
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
                            {hasFilters ? <Building2 className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-neutral-950">
                            {hasFilters ? "Filtrelere uyan kayıt yok" : "Henüz potansiyel müşteri yok"}
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                            {hasFilters
                                ? "Aramayı veya filtreleri temizleyerek tüm kayıtları görebilirsiniz."
                                : "İlk potansiyel müşteriyi ekleyip ilgilendiği kullanım alanlarını atayın."}
                        </p>
                        <Button type="button" className="mt-4 rounded-2xl" onClick={hasFilters ? clearFilters : openCreateDialog}>
                            {hasFilters ? "Filtreleri Temizle" : "Yeni Potansiyel Müşteri"}
                        </Button>
                    </div>
                ) : null}
            </div>

            {leads.length > 0 ? (
                <AdminListPagination
                    page={meta?.page ?? page}
                    totalPages={meta?.totalPages ?? 1}
                    total={meta?.total ?? 0}
                    limit={limit}
                    itemLabel="potansiyel müşteri"
                    onPageChange={setPage}
                    onLimitChange={(nextLimit) => {
                        setLimit(nextLimit)
                        setPage(1)
                    }}
                />
            ) : null}

            <LeadCustomerProfileDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                customer={editingCustomer}
                onCreated={handleCreated}
            />
        </div>
    )
}
