"use client"

import { useState } from "react"
import {
    Building2,
    Plus,
    Search,
    UserPlus,
    X,
} from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

import { resolveCustomerNameParts } from "@core/helpers/crm/customerDisplayName"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminListRefreshBar } from "@/features/admin/shared/components/AdminListRefreshBar"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { BulkSelectionBar } from "@/features/admin/shared/components/BulkSelectionBar"
import { useBulkSelection } from "@/features/admin/shared/hooks/useBulkSelection"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import { GeoAddressFilterFields } from "@/features/geo/components/GeoAddressFilterFields"
import type { LeadCustomer } from "@/features/admin/leadCustomers/api/types"
import { useLeadCustomerListFilters } from "@/features/admin/leadCustomers/hooks/useLeadCustomerListFilters"
import {
    useBulkDeleteLeadCustomers,
    useDeleteLeadCustomer,
    useLeadCustomers,
} from "@/features/admin/leadCustomers/hooks/useLeadCustomers"
import { LeadCustomerCard } from "./LeadCustomerCard"
import { LeadCustomerProfileDialog } from "./LeadCustomerProfileDialog"

type Props = {
    workspaceLabel: string
}

/**
 * Silme geri alınamaz; AWS'in kaynak silmede istediği gibi kullanıcı bu ifadeyi
 * harfi harfine yazmadan düğme açılmaz. TEKİL ve TOPLU silmede aynı ifade
 * (kullanıcı kararı): potansiyel müşteri silmek her iki durumda da kritik.
 */
const DELETE_CONFIRMATION = "KALICI OLARAK SİL"

/** `null` = kapalı; `customer: null` = yeni kayıt; `customer` dolu = düzenleme. */
type ProfileDialogState = { customer: LeadCustomer | null } | null

function formatNumber(value: number) {
    return new Intl.NumberFormat("tr-TR").format(value)
}

export function LeadCustomersPageClient({ workspaceLabel }: Props) {
    // TOPLU silme yalnız yöneticide: geri alınamaz ve tek tıkla çok kayıt gider.
    // Uç de aynı kuralı uyguluyor (`leadCustomerBulkDeleteGroups`), buradaki
    // kontrol yalnız arayüzü sunucuyla tutarlı tutmak için.
    // TEKİL silme veri girişi operatöründe de açık — asıl talep buydu.
    const { data: session } = useSession()
    const groups = session?.user?.groups ?? []
    const canBulkDelete = groups.includes("admin") || groups.includes("owner")

    const {
        filters,
        params,
        hasFilters,
        setSearch,
        setSectorValueId,
        setUsageAreaValueId,
        setGeo,
        setPage,
        setLimit,
        setRefreshIntervalSeconds,
        reset,
    } = useLeadCustomerListFilters()

    const attributesQuery = useAttributesForFilter()
    const leadsQuery = useLeadCustomers(params, {
        autoRefreshIntervalMs:
            filters.refreshIntervalSeconds > 0 ? filters.refreshIntervalSeconds * 1000 : false,
    })
    const leads = leadsQuery.data?.data ?? []
    const meta = leadsQuery.data?.meta
    const isInitialLoading = leadsQuery.isLoading && leads.length === 0
    // İlk yükleme skeleton'a ait; arka plan yenilemesi bölüm-yerel katmana.
    const isBackgroundRefreshing = leadsQuery.isFetching && !isInitialLoading

    const selection = useBulkSelection()
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [profileDialog, setProfileDialog] = useState<ProfileDialogState>(null)

    const sectorValues = attributesQuery.data?.find((attribute) => attribute.code === "sector")?.values ?? []
    const usageAreaValues =
        attributesQuery.data?.find((attribute) => attribute.code === "usage_area")?.values ?? []

    const withoutProfileCount = leads.filter(
        (lead) => !lead.sectorValue && lead.usageAreaValues.length === 0,
    ).length

    const deleteMutation = useDeleteLeadCustomer()
    const bulkDeleteMutation = useBulkDeleteLeadCustomers()

    const visibleIds = leads.map((lead) => lead.id)
    const visibleSelectionState = selection.visibleState(visibleIds)

    /** Onayda listelenecek adlar — sayfa değişince korunan seçim id'ye düşebilir. */
    const nameById = new Map(leads.map((lead) => [lead.id, resolveCustomerNameParts(lead).title]))
    const selectedNames = [...selection.selectedIds].map((id) => nameById.get(id) ?? id)

    const handleBulkDelete = async () => {
        const ids = [...selection.selectedIds]
        if (ids.length === 0) return

        const result = await bulkDeleteMutation.mutateAsync(ids)
        // Engelliler SEÇİLİ KALIR: kullanıcı hangilerinin kaldığını görüp
        // seçimden çıkarabilsin (silinenler zaten listeden düşüyor).
        selection.replace(result.blocked.map((row) => row.id))
    }

    /**
     * Kayıttan sonra yeni kayıt MUTLAKA görünür olmalı: aktif filtre veya 2.
     * sayfa yüzünden kart hiç render edilmezse kullanıcıya "hiçbir şey olmadı"
     * gibi görünür. TÜM filtreler (geo dahil — `reset()`) temizlenir, ilk sayfaya
     * dönülür, kart görünür ve açık gelir. Adressiz yeni bir kayıt aktif bir
     * il/ilçe filtresiyle asla eşleşmezdi; eski kod yalnız metin filtrelerini
     * temizliyordu. Adres formu kullanıcı "Adres Ekle" dediğinde açılır; kayıt
     * sonrası ikinci bir modal akışı başlatılmaz.
     */
    function handleCreated(customerId: string) {
        reset()
        setExpandedId(customerId)
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

                    <Button
                        type="button"
                        className="rounded-2xl"
                        onClick={() => setProfileDialog({ customer: null })}
                    >
                        <Plus className="h-4 w-4" />
                        Yeni Potansiyel Müşteri
                    </Button>
                </div>

                <Separator className="my-5" />

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_240px] lg:items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={filters.search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Firma, yetkili, e-posta veya telefon ara"
                            className="h-11 rounded-2xl pl-9"
                        />
                    </div>

                    <SearchableSelect
                        aria-label="Sektör"
                        value={filters.sectorValueId || null}
                        onValueChange={(value) => setSectorValueId(value ?? "")}
                        options={sectorValues.map((value) => ({ value: value.id, label: value.name }))}
                        placeholder="Tüm sektörler"
                        searchPlaceholder="Sektör ara"
                        loading={attributesQuery.isLoading}
                    />

                    <SearchableSelect
                        aria-label="Kullanım alanı"
                        value={filters.usageAreaValueId || null}
                        onValueChange={(value) => setUsageAreaValueId(value ?? "")}
                        options={usageAreaValues.map((value) => ({ value: value.id, label: value.name }))}
                        placeholder="Tüm kullanım alanları"
                        searchPlaceholder="Kullanım alanı ara"
                        loading={attributesQuery.isLoading}
                    />
                </div>

                {/* Adres filtresi kendi satırında: üstteki ızgara dört sütuna göre
                    kurulmuş, üç alan daha eklemek sarmayı bozuyordu. */}
                <div className="mt-3 grid gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:items-center">
                    <GeoAddressFilterFields
                        countryId={filters.countryId}
                        stateId={filters.stateId}
                        cityId={filters.cityId}
                        onChange={setGeo}
                    />

                    {hasFilters ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-2xl"
                            onClick={reset}
                        >
                            <X className="h-4 w-4" />
                            Temizle
                        </Button>
                    ) : null}
                </div>
            </section>

            <AdminListRefreshBar
                dataUpdatedAt={leadsQuery.dataUpdatedAt}
                isFetching={leadsQuery.isFetching}
                onRefresh={handleRefresh}
                refreshIntervalSeconds={filters.refreshIntervalSeconds}
                onRefreshIntervalChange={setRefreshIntervalSeconds}
            />

            {canBulkDelete ? (
                <div className="space-y-2">
                    <BulkSelectionBar
                        selectedCount={selection.selectedCount}
                        isDeleting={bulkDeleteMutation.isPending}
                        onClear={selection.clear}
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
                                    visibleSelectionState === "all"
                                        ? true
                                        : visibleSelectionState === "some"
                                            ? "indeterminate"
                                            : false
                                }
                                onCheckedChange={() => selection.toggleVisible(visibleIds)}
                            />
                            Bu sayfadaki {leads.length} kaydı seç
                        </label>
                    ) : null}
                </div>
            ) : null}

            <div className="relative">
                <AdminSectionLoadingOverlay isVisible={isBackgroundRefreshing} label="Liste güncelleniyor…" />

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
                                onEdit={() => setProfileDialog({ customer })}
                                isSelected={selection.isSelected(customer.id)}
                                onToggleSelect={() => selection.toggle(customer.id)}
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
                            <Button
                                type="button"
                                className="mt-4 rounded-2xl"
                                onClick={hasFilters ? reset : () => setProfileDialog({ customer: null })}
                            >
                                {hasFilters ? "Filtreleri Temizle" : "Yeni Potansiyel Müşteri"}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </div>

            {leads.length > 0 ? (
                <AdminListPagination
                    page={meta?.page ?? filters.page}
                    totalPages={meta?.totalPages ?? 1}
                    total={meta?.total ?? 0}
                    limit={filters.limit}
                    itemLabel="potansiyel müşteri"
                    onPageChange={setPage}
                    onLimitChange={setLimit}
                />
            ) : null}

            <LeadCustomerProfileDialog
                open={profileDialog !== null}
                // Dialog yalnız kapanışı bildirir (`open === false`); açılış bu
                // sayfada `setProfileDialog({ customer })` ile tetiklenir.
                onOpenChange={(open) => {
                    if (!open) setProfileDialog(null)
                }}
                customer={profileDialog?.customer}
                onCreated={handleCreated}
            />
        </div>
    )
}
