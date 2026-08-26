"use client"

import { useDeferredValue, useMemo, useState } from "react"
import {
    Building2,
    ChevronDown,
    Loader2,
    Globe,
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
import { resolveCustomerNameParts } from "@core/helpers/crm/customerDisplayName"
import { formatWebsiteLabel } from "@core/helpers/crm/customerWebsite"
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
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { Checkbox } from "@/components/ui/checkbox"
import { BulkSelectionBar } from "@/features/admin/shared/components/BulkSelectionBar"
import { GeoAddressFilterFields } from "@/features/geo/components/GeoAddressFilterFields"
import { Trash2 } from "lucide-react"
import { ConfirmDeleteDialog } from "@/features/admin/shared/components/ConfirmDeleteDialog"
import { useSession } from "next-auth/react"
import {
    useBulkDeleteLeadCustomers,
    useDeleteLeadCustomer,
} from "@/features/admin/leadCustomers/hooks/useLeadCustomers"

const ALL_VALUE = "__all__"

type Props = {
    workspaceLabel: string
}

// Ülke varsayılanı (Türkiye) `GeoAddressFilterFields` içinde ISO kodundan
// çözülür — veri kümesinin sayısal id'si sabit kodlanmaz.

/**
 * Silme geri alınamaz; AWS'in kaynak silmede istediği gibi kullanıcı bu ifadeyi
 * harfi harfine yazmadan düğme açılmaz. TEKİL ve TOPLU silmede aynı ifade
 * (kullanıcı kararı): potansiyel müşteri silmek her iki durumda da kritik.
 */
const DELETE_CONFIRMATION = "KALICI OLARAK SİL"

function formatNumber(value: number) {
    return new Intl.NumberFormat("tr-TR").format(value)
}

function LeadCustomerCard({
    customer,
    isExpanded,
    onToggle,
    onEdit,
    isSelected,
    onToggleSelect,
    onDelete,
    isDeleting,
    canDelete,
    canSelect,
}: {
    customer: LeadCustomer
    isExpanded: boolean
    onToggle: () => void
    onEdit: () => void
    isSelected: boolean
    onToggleSelect: () => void
    onDelete: () => void
    isDeleting: boolean
    canDelete: boolean
    /** Toplu seçim kutusu yalnız toplu silme yetkisi varken görünür. */
    canSelect: boolean
}) {
    const usageAreaCount = customer.usageAreaValues.length
    const hasProfile = Boolean(customer.sectorValue) || usageAreaCount > 0
    // Firma adı başlık, yetkili adı (varsa) alt satır; ikisi de yoksa fallback.
    const nameParts = resolveCustomerNameParts(customer)
    const websiteLabel = formatWebsiteLabel(customer.websiteUrl)

    return (
        <div
            className={cn(
                "overflow-hidden rounded-2xl border bg-white transition-colors",
                isSelected ? "border-brand/60 bg-brand/[0.03]" : "border-neutral-200",
            )}
        >
            <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
                {canSelect ? (
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onToggleSelect}
                        aria-label={`${resolveCustomerNameParts(customer).title} seç`}
                        className="mt-1 shrink-0"
                    />
                ) : null}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-neutral-950">
                            {nameParts.title}
                        </span>
                        {nameParts.subtitle ? (
                            <span className="text-sm text-neutral-500">{nameParts.subtitle}</span>
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
                        {customer.email ? (
                            <span className="inline-flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                {customer.email}
                            </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {customer.phone}
                        </span>
                        {websiteLabel ? (
                            <a
                                href={customer.websiteUrl ?? undefined}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex items-center gap-1 text-brand hover:underline"
                                // Kart tıklaması kartı açıp kapatıyor; link onu tetiklemesin.
                                onClick={(event) => event.stopPropagation()}
                            >
                                <Globe className="h-3.5 w-3.5" />
                                {websiteLabel}
                            </a>
                        ) : null}
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
                    {canDelete ? (
                        <ConfirmDeleteDialog
                            trigger={
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="size-9 rounded-2xl"
                                    aria-label="Sil"
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                            }
                            title={`${resolveCustomerNameParts(customer).title} silinsin mi?`}
                            description={
                                <>
                                    Bu işlem geri alınamaz. Kaydın adresleri, ziyaretleri ve profil
                                    atamaları da silinir. Siparişi, portal kullanıcısı veya iş talebi
                                    olan kayıtlar silinmez.
                                </>
                            }
                            confirmationPhrase={DELETE_CONFIRMATION}
                            onConfirm={onDelete}
                        />
                    ) : null}
                </div>
            </div>

            {isExpanded ? (
                <div className="border-t border-neutral-100 bg-neutral-50/60 p-4">
                    <LeadCustomerDetailPanel
                        customerId={customer.id}
                    />
                </div>
            ) : null}
        </div>
    )
}

export function LeadCustomersPageClient({ workspaceLabel }: Props) {
    // TOPLU silme yalnız yöneticide: geri alınamaz ve tek tıkla çok kayıt gider.
    // Uç de aynı kuralı uyguluyor (`leadCustomerBulkDeleteGroups`), buradaki
    // kontrol yalnız arayüzü sunucuyla tutarlı tutmak için.
    // TEKİL silme veri girişi operatöründe de açık — asıl talep buydu.
    const { data: session } = useSession()
    const groups: string[] = ((session?.user as { groups?: string[] } | undefined)?.groups) ?? []
    const canBulkDelete = groups.includes("admin") || groups.includes("owner")
    // Filtreler URL'de (nuqs): ekran paylaşılabilir olsun ve geri tuşu filtreyi
    // korusun (AGENTS.md URL query state kuralı). Öncesinde `useState`'teydiler.
    const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
    const [sectorValueId, setSectorValueId] = useQueryState("sector", parseAsString.withDefault(""))
    const [usageAreaValueId, setUsageAreaValueId] = useQueryState("usage", parseAsString.withDefault(""))
    const [countryId, setCountryId] = useQueryState("country", parseAsInteger)
    const [stateId, setStateId] = useQueryState("state", parseAsInteger)
    const [cityId, setCityId] = useQueryState("city", parseAsInteger)
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
    const [limit, setLimit] = useQueryState("limit", parseAsInteger.withDefault(20))
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
    const [expandedId, setExpandedId] = useState<string | null>(null)
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
            ...(countryId ? { countryId } : {}),
            ...(stateId ? { stateId } : {}),
            ...(cityId ? { cityId } : {}),
        }),
        [cityId, countryId, deferredSearch, limit, page, sectorValueId, stateId, usageAreaValueId],
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

    // Ülke varsayılanı Türkiye olduğu için "filtre var mı" sayımına GİRMEZ:
    // aksi hâlde sayfa her açılışta "filtreli" görünür ve boş sonuçta kullanıcıya
    // yanlışlıkla "filtreleri temizle" önerilirdi.
    const hasFilters = Boolean(
        search.trim() || sectorValueId || usageAreaValueId || stateId || cityId,
    )

    function clearFilters() {
        setSearch("")
        setSectorValueId("")
        setUsageAreaValueId("")
        setStateId(null)
        setCityId(null)
        setPage(1)
    }

    const deleteMutation = useDeleteLeadCustomer()
    const bulkDeleteMutation = useBulkDeleteLeadCustomers()

    const toggleSelect = (id: string) => {
        setSelectedIds((current) => {
            const next = new Set(current)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    /** Görünen sayfadaki kayıtların tamamını seçer; hepsi seçiliyse bırakır. */
    const toggleSelectAllVisible = () => {
        const visibleIds = leads.map((lead) => lead.id)
        setSelectedIds((current) => {
            const allSelected = visibleIds.length > 0 && visibleIds.every((id) => current.has(id))
            const next = new Set(current)
            for (const id of visibleIds) {
                if (allSelected) next.delete(id)
                else next.add(id)
            }
            return next
        })
    }

    /**
     * Onayda listelenecek adlar. Seçim sayfa değişince korunuyor; görünen
     * sayfada olmayan bir kaydın adı elde olmayabilir, o yüzden id'ye düşülür —
     * kullanıcı yine de kaç kaydın gideceğini ve bulunanların adını görür.
     */
    const selectedNames = useMemo(() => {
        const byId = new Map(leads.map((lead) => [lead.id, resolveCustomerNameParts(lead).title]))
        return [...selectedIds].map((id) => byId.get(id) ?? id)
    }, [leads, selectedIds])

    const handleBulkDelete = async () => {
        const ids = [...selectedIds]
        if (ids.length === 0) return

        const result = await bulkDeleteMutation.mutateAsync(ids)
        // Engelliler SEÇİLİ KALIR: kullanıcı hangilerinin kaldığını görüp
        // seçimden çıkarabilsin (silinenler zaten listeden düşüyor).
        setSelectedIds(new Set(result.blocked.map((row) => row.id)))
    }

    /**
     * Kayıttan sonra yeni kayıt MUTLAKA görünür olmalı: aktif filtre veya 2.
     * sayfa yüzünden kart hiç render edilmezse kullanıcıya "hiçbir şey olmadı"
     * gibi görünür. Bu yüzden filtreler temizlenir, ilk sayfaya dönülür,
     * kart görünür ve açık gelir. Adres formu kullanıcı "Adres Ekle" dediğinde
     * açılır; kayıt sonrası ikinci bir modal akışı başlatılmaz.
     */
    function handleCreated(customerId: string) {
        setSearch("")
        setSectorValueId("")
        setUsageAreaValueId("")
        setPage(1)
        setExpandedId(customerId)
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
                <div className="bg-linear-to-br from-neutral-950 via-neutral-900 to-brand px-5 py-6 text-white sm:px-7">
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

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_240px] lg:items-center">
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

                </div>

                {/* Adres filtresi kendi satırında: üstteki ızgara dört sütuna göre
                    kurulmuş, üç alan daha eklemek sarmayı bozuyordu. */}
                <div className="mt-3 grid gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:items-center">
                    <GeoAddressFilterFields
                        countryId={countryId}
                        stateId={stateId}
                        cityId={cityId}
                        onChange={(patch) => {
                            if (patch.countryId !== undefined) setCountryId(patch.countryId)
                            if (patch.stateId !== undefined) setStateId(patch.stateId)
                            if (patch.cityId !== undefined) setCityId(patch.cityId)
                            setPage(1)
                        }}
                    />

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

            {canBulkDelete ? (
                <div className="space-y-2">
                    <BulkSelectionBar
                        selectedCount={selectedIds.size}
                        isDeleting={bulkDeleteMutation.isPending}
                        onClear={() => setSelectedIds(new Set())}
                        onDelete={handleBulkDelete}
                        itemLabel="potansiyel müşteri"
                        itemNames={selectedNames}
                        confirmationPhrase={DELETE_CONFIRMATION}
                        confirmDescription={
                            <>
                                Bu işlem geri alınamaz. Kayıtların adresleri, ziyaretleri ve profil
                                atamaları da silinir.
                                <br />
                                <br />
                                Siparişi, portal kullanıcısı veya iş talebi olan kayıtlar silinmez —
                                hangileri olduğu işlem sonunda bildirilir ve seçili kalırlar.
                            </>
                        }
                    />
                    {leads.length > 0 ? (
                        <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-neutral-600">
                            <Checkbox
                                checked={
                                    leads.every((lead) => selectedIds.has(lead.id))
                                        ? true
                                        : leads.some((lead) => selectedIds.has(lead.id))
                                            ? "indeterminate"
                                            : false
                                }
                                onCheckedChange={toggleSelectAllVisible}
                            />
                            Bu sayfadaki {leads.length} kaydı seç
                        </label>
                    ) : null}
                </div>
            ) : null}

            <div aria-busy={leadsQuery.isFetching} className="space-y-3">
                {isInitialLoading
                    ? Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-33 animate-pulse rounded-2xl border border-neutral-100 bg-neutral-50"
                        />
                    ))
                    : leads.map((customer) => (
                        <LeadCustomerCard
                            key={customer.id}
                            customer={customer}
                            isExpanded={expandedId === customer.id}
                            onToggle={() =>
                                setExpandedId((current) => (current === customer.id ? null : customer.id))
                            }
                            onEdit={() => openEditDialog(customer)}
                            isSelected={selectedIds.has(customer.id)}
                            onToggleSelect={() => toggleSelect(customer.id)}
                            onDelete={() => deleteMutation.mutate(customer.id)}
                            isDeleting={deleteMutation.isPending}
                            canDelete
                            canSelect={canBulkDelete}
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
