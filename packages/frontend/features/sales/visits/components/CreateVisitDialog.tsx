"use client"

import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { useSession } from "next-auth/react"
import { CalendarClock, Search, Users } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { GeoAddressFilterFields } from "@/features/geo/components/GeoAddressFilterFields"
import { useManagedProductAttributesForFilter } from "@/features/customerLocations/hooks/useManagedProductAttributesForFilter"
import { useManagedCustomersInfinite } from "@/features/sales/customers/hooks/useManagedCustomersInfinite"
import { useManagedLeadCustomersInfinite } from "@/features/sales/leadCustomers/hooks/useManagedLeadCustomersInfinite"
import { useCreateManagedCustomerVisit } from "@/features/sales/visits/hooks/useCreateManagedCustomerVisit"
import { VISIT_TYPE_LABELS } from "@/features/sales/visits/lib/visitLabels"
import { resolveCustomerDisplayName } from "@core/helpers/crm/customerDisplayName"
import type { CustomerVisitType } from "@/features/admin/customers/api/types"

type SelectedCustomer = { id: string; name: string; status: "LEAD" | "CUSTOMER" }
type CustomerTypeFilter = "ALL" | "CUSTOMER" | "LEAD"

const CUSTOMER_TYPE_FILTER_OPTIONS: { value: CustomerTypeFilter; label: string }[] = [
    { value: "ALL", label: "Tümü" },
    { value: "CUSTOMER", label: "Cari" },
    { value: "LEAD", label: "Potansiyel" },
]

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateVisitDialog({ open, onOpenChange }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
                {/* Gövde key ile taze mount edilir → dialog her açılışta sıfırlanır. */}
                {open ? <ComposerBody key="create-visit" onDone={() => onOpenChange(false)} /> : null}
            </DialogContent>
        </Dialog>
    )
}

/**
 * Bir sonsuz-kaydırma bölümünün sonunda görünmez bir sentinel'i izler; sentinel
 * `root` (scroll container) içinde görünür olduğunda ve bir sonraki sayfa
 * varsa `onLoadMore`'u tetikler. `CreateVisitDialog`'daki cari/potansiyel
 * bölümleri BAĞIMSIZ sayfalandığı için (iki ayrı uç) her bölüm kendi
 * sentinel'iyle izlenir.
 */
function useLoadMoreSentinel({
    sentinelRef,
    rootRef,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
}: {
    sentinelRef: RefObject<HTMLDivElement | null>
    rootRef: RefObject<HTMLDivElement | null>
    hasNextPage: boolean
    isFetchingNextPage: boolean
    onLoadMore: () => void
}) {
    useEffect(() => {
        const node = sentinelRef.current
        if (!node || !hasNextPage) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && !isFetchingNextPage) {
                    onLoadMore()
                }
            },
            { root: rootRef.current, rootMargin: "120px" },
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [sentinelRef, rootRef, hasNextPage, isFetchingNextPage, onLoadMore])
}

function ComposerBody({ onDone }: { onDone: () => void }) {
    const { data: session } = useSession()
    // DİKKAT: `session.user.id` Cognito sub'ıdır; `ownerUserId` DB `User.id`
    // FK'sına bağlanır — bu yüzden `dbUserId` kullanılmalı (bkz. lib/auth/auth.ts).
    const ownerUserId = session?.user?.dbUserId

    const [search, setSearch] = useState("")
    const [customerTypeFilter, setCustomerTypeFilter] = useState<CustomerTypeFilter>("ALL")
    const [sectorValueId, setSectorValueId] = useState("")
    const [countryId, setCountryId] = useState<number | null>(null)
    const [stateId, setStateId] = useState<number | null>(null)
    const [cityId, setCityId] = useState<number | null>(null)
    const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null)
    const [scheduledAt, setScheduledAt] = useState("")
    const [title, setTitle] = useState("")
    const [type, setType] = useState<CustomerVisitType>("IN_PERSON")
    const [note, setNote] = useState("")

    const attributesQuery = useManagedProductAttributesForFilter()

    // Müşteri sayısı çok olabileceği için (API/frontend performansı) arama
    // metni veya en az bir filtre (sektör/il/ilçe) verilmeden sorgu ATILMAZ —
    // dialog açılır açılmaz "ilk 10 kayıt" gibi anlamsız/pahalı bir liste
    // çekilmez. `countryId` BİLEREK sayılmaz: `GeoAddressFilterFields`
    // yüklenir yüklenmez Türkiye'ye otomatik varsayılıyor (bkz. CustomerMapFilterBar
    // deseni), o yüzden "filtre var mı" sayımına girerse sorgu her zaman aktif olurdu.
    const hasActiveQuery = Boolean(search.trim() || sectorValueId || stateId || cityId)
    const showCustomers = customerTypeFilter !== "LEAD"
    const showLeads = customerTypeFilter !== "CUSTOMER"

    // Cari müşteriler (kendisine atanmış) + potansiyel müşteriler (kullanıcı
    // talebiyle: "satış temsilcisi potansiyel müşterileri de ziyaret
    // edebilir" — leadler sahiplenilmemiş açık bir havuz, bkz.
    // `canManageCustomerVisit`) İKİ AYRI ucun sonuçları birleştirilerek tek
    // bir seçici içinde, bölümlenmiş olarak gösterilir. Opsiyonel müşteri
    // türü filtresiyle yalnız biri de gösterilebilir. Tüm müşterileri tek
    // seferde çekmek yerine (performans) her bölüm kendi sonsuz kaydırma
    // sayfalamasıyla (`useInfiniteQuery`) ilerler — bkz. `useLoadMoreSentinel`.
    const customersQuery = useManagedCustomersInfinite(
        {
            limit: 10,
            search: search.trim() || undefined,
            status: "CUSTOMER",
            sectorValueId: sectorValueId || undefined,
            countryId: countryId ?? undefined,
            stateId: stateId ?? undefined,
            cityId: cityId ?? undefined,
        },
        { enabled: hasActiveQuery && showCustomers },
    )
    const leadsQuery = useManagedLeadCustomersInfinite(
        {
            limit: 10,
            search: search.trim() || undefined,
            sectorValueId: sectorValueId || undefined,
            countryId: countryId ?? undefined,
            stateId: stateId ?? undefined,
            cityId: cityId ?? undefined,
        },
        { enabled: hasActiveQuery && showLeads },
    )
    // `enabled: false` olan bir sorgunun `data`'sı TanStack Query'de SIFIRLANMAZ
    // (cache'te kalır) — bu yüzden dizi doğrudan sorgudan değil, `showCustomers`/
    // `showLeads`'e göre GATE'lenerek türetilir; yoksa "Cari" filtresine
    // geçildiğinde önceki "Tümü" sorgusundan gelen potansiyel sonuçlar
    // ekranda kalmaya devam ederdi.
    const customers = useMemo(
        () => (showCustomers ? (customersQuery.data?.pages.flatMap((page) => page.data) ?? []) : []),
        [showCustomers, customersQuery.data],
    )
    const leads = useMemo(
        () => (showLeads ? (leadsQuery.data?.pages.flatMap((page) => page.data) ?? []) : []),
        [showLeads, leadsQuery.data],
    )
    const isSearching = hasActiveQuery && (customersQuery.isLoading || leadsQuery.isLoading)
    const hasResults = customers.length > 0 || leads.length > 0

    const viewportRef = useRef<HTMLDivElement>(null)
    const customersSentinelRef = useRef<HTMLDivElement>(null)
    const leadsSentinelRef = useRef<HTMLDivElement>(null)
    const loadMoreCustomers = () => void customersQuery.fetchNextPage()
    const loadMoreLeads = () => void leadsQuery.fetchNextPage()

    useLoadMoreSentinel({
        sentinelRef: customersSentinelRef,
        rootRef: viewportRef,
        hasNextPage: Boolean(customersQuery.hasNextPage),
        isFetchingNextPage: customersQuery.isFetchingNextPage,
        onLoadMore: loadMoreCustomers,
    })
    useLoadMoreSentinel({
        sentinelRef: leadsSentinelRef,
        rootRef: viewportRef,
        hasNextPage: Boolean(leadsQuery.hasNextPage),
        isFetchingNextPage: leadsQuery.isFetchingNextPage,
        onLoadMore: loadMoreLeads,
    })

    const sectorOptions = useMemo(() => {
        const sectorValues = attributesQuery.data?.find((attribute) => attribute.code === "sector")?.values ?? []
        return sectorValues.map((value) => ({ value: value.id, label: value.name }))
    }, [attributesQuery.data])

    const createMutation = useCreateManagedCustomerVisit()

    async function handleSubmit() {
        if (!ownerUserId) {
            toast.error("Oturum bilgisi okunamadı, sayfayı yenileyin")
            return
        }
        if (!selectedCustomer) {
            toast.error("Bir müşteri seçin")
            return
        }
        if (!scheduledAt || !title.trim()) {
            toast.error("Tarih ve başlık zorunlu")
            return
        }

        try {
            await createMutation.mutateAsync({
                customerId: selectedCustomer.id,
                ownerUserId,
                scheduledAt: new Date(scheduledAt).toISOString(),
                title: title.trim(),
                note: note.trim() || null,
                type,
            })
            toast.success("Ziyaret planlandı")
            onDone()
        } catch {
            toast.error("Ziyaret planlanamadı")
        }
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <CalendarClock className="size-4" />
                    Yeni Ziyaret Planla
                </DialogTitle>
                <DialogDescription>
                    Bir müşteri seçip ziyaret tarihini ve türünü belirleyin.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
                <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                        <Users className="size-3.5 text-neutral-400" />
                        Müşteri
                    </Label>
                    {selectedCustomer ? (
                        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="min-w-0 truncate font-medium text-emerald-900">
                                    {selectedCustomer.name}
                                </span>
                                <Badge variant="outline" className="shrink-0 text-[10px]">
                                    {selectedCustomer.status === "LEAD" ? "Potansiyel" : "Cari"}
                                </Badge>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="shrink-0"
                                onClick={() => setSelectedCustomer(null)}
                            >
                                Değiştir
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                    <Input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Cari veya potansiyel müşteri ara"
                                        className="pl-9"
                                    />
                                </div>
                                <Select
                                    value={customerTypeFilter}
                                    onValueChange={(value) => setCustomerTypeFilter(value as CustomerTypeFilter)}
                                >
                                    <SelectTrigger className="w-full sm:w-40" aria-label="Müşteri türü">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CUSTOMER_TYPE_FILTER_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Müşteri sayısı çok olabileceği için sektör/il-ilçe filtresi —
                                performans hem API hem frontend tarafında: sorgu yalnız arama
                                metni veya bir filtre girilince atılır (bkz. `hasActiveQuery`). */}
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                <SearchableSelect
                                    aria-label="Sektör"
                                    value={sectorValueId || null}
                                    onValueChange={(value) => setSectorValueId(value ?? "")}
                                    options={sectorOptions}
                                    placeholder="Tüm sektörler"
                                    searchPlaceholder="Sektör ara"
                                    loading={attributesQuery.isLoading}
                                />
                                <GeoAddressFilterFields
                                    countryId={countryId}
                                    stateId={stateId}
                                    cityId={cityId}
                                    onChange={(patch) => {
                                        if (patch.countryId !== undefined) setCountryId(patch.countryId)
                                        if (patch.stateId !== undefined) setStateId(patch.stateId)
                                        if (patch.cityId !== undefined) setCityId(patch.cityId)
                                    }}
                                />
                            </div>

                            <ScrollArea
                                viewportRef={viewportRef}
                                className="h-64 rounded-xl border border-neutral-200 sm:h-80"
                            >
                                {!hasActiveQuery ? (
                                    <div className="flex h-64 items-center justify-center px-6 text-center text-sm text-neutral-500 sm:h-80">
                                        Müşteri aramak için yazın veya sektör/il-ilçe filtresi seçin.
                                    </div>
                                ) : isSearching ? (
                                    <div className="flex h-64 items-center justify-center sm:h-80">
                                        <Spinner className="size-4" />
                                    </div>
                                ) : !hasResults ? (
                                    <div className="flex h-64 items-center justify-center text-center text-sm text-neutral-500 sm:h-80">
                                        Müşteri bulunamadı
                                    </div>
                                ) : (
                                    <div className="divide-y divide-neutral-100">
                                        {customers.length > 0 ? (
                                            <div>
                                                {customerTypeFilter === "ALL" ? (
                                                    <div className="bg-neutral-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                                                        Cari Müşteriler
                                                    </div>
                                                ) : null}
                                                {customers.map((customer) => {
                                                    const name = resolveCustomerDisplayName(customer)
                                                    return (
                                                        <button
                                                            key={customer.id}
                                                            type="button"
                                                            onClick={() => setSelectedCustomer({ id: customer.id, name, status: "CUSTOMER" })}
                                                            className="block w-full truncate px-3 py-2.5 text-left text-sm hover:bg-neutral-50"
                                                        >
                                                            {name}
                                                        </button>
                                                    )
                                                })}
                                                {customersQuery.hasNextPage ? (
                                                    <div ref={customersSentinelRef} className="flex items-center justify-center py-2">
                                                        {customersQuery.isFetchingNextPage ? (
                                                            <Spinner className="size-3.5" />
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                        {leads.length > 0 ? (
                                            <div>
                                                {customerTypeFilter === "ALL" ? (
                                                    <div className="bg-neutral-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                                                        Potansiyel Müşteriler
                                                    </div>
                                                ) : null}
                                                {leads.map((lead) => {
                                                    const name = resolveCustomerDisplayName(lead)
                                                    return (
                                                        <button
                                                            key={lead.id}
                                                            type="button"
                                                            onClick={() => setSelectedCustomer({ id: lead.id, name, status: "LEAD" })}
                                                            className="block w-full truncate px-3 py-2.5 text-left text-sm hover:bg-neutral-50"
                                                        >
                                                            {name}
                                                        </button>
                                                    )
                                                })}
                                                {leadsQuery.hasNextPage ? (
                                                    <div ref={leadsSentinelRef} className="flex items-center justify-center py-2">
                                                        {leadsQuery.isFetchingNextPage ? (
                                                            <Spinner className="size-3.5" />
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="visit-scheduled-at">Tarih</Label>
                        <Input
                            id="visit-scheduled-at"
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(event) => setScheduledAt(event.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Tür</Label>
                        <Select value={type} onValueChange={(value) => setType(value as CustomerVisitType)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(VISIT_TYPE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="visit-title">Başlık</Label>
                    <Input
                        id="visit-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Ör. Tanışma ziyareti"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="visit-note">Not</Label>
                    <Textarea
                        id="visit-note"
                        rows={4}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Ziyaret öncesi plan/gündem"
                    />
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onDone}>Vazgeç</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Kaydediliyor..." : "Ziyareti Planla"}
                </Button>
            </DialogFooter>
        </>
    )
}
