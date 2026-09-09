"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronUp, List, MapPinned } from "lucide-react"
import { toast } from "sonner"
import { parseAsBoolean, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ManagedCustomerMap } from "@/features/customerLocations/components/ManagedCustomerMap"
import { CustomerMapCustomerAccordion } from "@/features/customerLocations/components/CustomerMapCustomerAccordion"
import {
    CustomerMapFilterBar,
    type CustomerMapFilters,
} from "@/features/customerLocations/components/CustomerMapFilterBar"
import { useCustomerMapData } from "@/features/customerLocations/hooks/useCustomerMapData"
import { useProtectedUsers } from "@/features/customerLocations/hooks/useProtectedUsers"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import { useBulkSelection } from "@/features/admin/shared/hooks/useBulkSelection"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { DEFAULT_ADMIN_LIST_PAGE_SIZE, normalizeAdminPageSize } from "@/features/admin/shared/config"
import { useGeoCities } from "@/features/geo/hooks/useGeoCities"
import { useGeoCountries } from "@/features/geo/hooks/useGeoCountries"
import { useGeoStates } from "@/features/geo/hooks/useGeoStates"
import { groupCustomerMapPoints } from "@/features/customerLocations/lib/groupCustomerMapPoints"
import type { CustomerMapPoint } from "@/features/customerLocations/types"
import { getUserDisplayName } from "@/lib/users/displayName"

type Bounds = {
    north: number
    south: number
    east: number
    west: number
}

type Props = {
    title: string
    description: string
    customerDetailBasePath: string
    allowSalesFilter: boolean
}

// Her render'da yeni `[]` üretilirse harita efektleri boş yere tetiklenir.
const EMPTY_POINTS: CustomerMapPoint[] = []

const MAP_RESULT_LIMIT = 500

// Segment ilk açıldığında yalnız bu kadar müşteri (peek) gösterilir; kalanı
// "Tümünü Göster" ile açılır — `ProductUsageAreasTable`'daki peek deseniyle
// aynı fikir (kullanıcı örneği), tek fark: sayfalanmış tam liste `AdminListPagination`
// ile geliyor, peek modunda sayfalama/toplu-seç satırı gösterilmiyor.
const PEEK_CUSTOMER_COUNT = 3

const EMPTY_HINT =
    "Segment seçip “Listele”ye basın — eşleşen müşteriler önce liste olarak gösterilir."

const LIST_EMPTY_MESSAGE =
    "Seçilen filtrelerle eşleşen müşteri bulunamadı. Filtreleri gevşetip tekrar deneyebilirsiniz."

// Seçilen coğrafi seviyeye göre "bölgeye uç" zoom'u (müşteri yoksa fallback).
const COUNTRY_FOCUS_ZOOM = 5
const STATE_FOCUS_ZOOM = 8
const CITY_FOCUS_ZOOM = 11

function toFiniteCoord(value: string | number | null | undefined) {
    if (value === null || value === undefined) return null
    const parsed = typeof value === "number" ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

function useDebouncedBounds(bounds: Bounds | null, delayMs: number) {
    const [debouncedBounds, setDebouncedBounds] = useState<Bounds | null>(bounds)

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedBounds(bounds)
        }, delayMs)

        return () => window.clearTimeout(timeout)
    }, [bounds, delayMs])

    return debouncedBounds
}

/**
 * Panel şablonundaki (`PanelShell`) üst çubuk masaüstünde `position: sticky`
 * ile ekranın en üstüne yapışık kalır; bu sayfanın kendi aksiyon çubuğu
 * (Gizle/Haritada Göster) onun ALTINA sabitlenecekse yüksekliği bilinmeli.
 * Sabit bir piksel yazmak şablon değişince sessizce kayardı, o yüzden DOM'dan
 * ölçülür. Mobilde bu header hiç render edilmez (`hidden md:block`), o zaman
 * offset 0 kalır ve çubuk doğrudan viewport üstüne yapışır.
 */
function usePanelHeaderOffset() {
    const [offset, setOffset] = useState(0)

    useEffect(() => {
        const header = document.querySelector("header")
        if (!header) return

        const update = () => setOffset(header.getBoundingClientRect().height)
        update()

        const observer = new ResizeObserver(update)
        observer.observe(header)
        return () => observer.disconnect()
    }, [])

    return offset
}

export function CustomerMapPageClient({
    title,
    description,
    customerDetailBasePath,
    allowSalesFilter,
}: Props) {
    // Filtreler URL'de (nuqs): ekran paylaşılabilir, geri tuşu segment seçimini
    // korur. `applied` = kullanıcı bilinçli olarak "Listele"ye bastı mı. Bir
    // filtre değişince `applied` false olur; yeni istek ancak tekrar butona
    // basılınca gider (DB yükü azalır). Harita (`view === "map"`) bundan ayrı
    // bir sonraki adım — DB isteğinden bağımsız olarak Google Maps JS'in kendisi
    // yalnız kullanıcı "Haritada Göster" deyince yüklenir.
    const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
    const [status, setStatus] = useQueryState("status", parseAsString.withDefault("ALL"))
    const [rep, setRep] = useQueryState("rep", parseAsString.withDefault("ALL"))
    const [sector, setSector] = useQueryState("sector", parseAsString.withDefault(""))
    const [usage, setUsage] = useQueryState("usage", parseAsString.withDefault(""))
    const [countryId, setCountryId] = useQueryState("country", parseAsInteger)
    const [stateId, setStateId] = useQueryState("state", parseAsInteger)
    const [cityId, setCityId] = useQueryState("city", parseAsInteger)
    const [applied, setApplied] = useQueryState("applied", parseAsBoolean.withDefault(false))
    // Filtre uygulanınca ÖNCE liste gösterilir; harita yalnız kullanıcı bir
    // "Haritada Göster" aksiyonuna basınca (Google Maps JS bu anda yüklenir).
    const [view, setView] = useQueryState("view", parseAsStringLiteral(["list", "map"] as const).withDefault("list"))
    // `null` = filtreyle eşleşen TÜM müşteriler haritada; dolu dizi = yalnız
    // liste görünümünden seçilen/tekil müşteri(ler).
    const [mapCustomerIds, setMapCustomerIds] = useState<string[] | null>(null)
    const selection = useBulkSelection()
    // Liste görünümü tek istekte gelen (backend `take: 500`) TÜM segmenti aynı
    // anda accordion olarak basmaz — 200+ müşteri tek sayfada ele alınamaz
    // uzunlukta olur. Sayfalama client-side: ek istek yok, zaten çekilmiş
    // `groups` dizisi dilimlenir (admin listeleriyle aynı bileşen: `AdminListPagination`).
    const [listPage, setListPage] = useQueryState("page", parseAsInteger.withDefault(1))
    const [listLimit, setListLimit] = useQueryState("limit", parseAsInteger.withDefault(DEFAULT_ADMIN_LIST_PAGE_SIZE))
    const normalizedListLimit = normalizeAdminPageSize(listLimit)
    // Segment yeni uygulandığında liste PEEK modunda başlar (bkz. PEEK_CUSTOMER_COUNT).
    const [isListExpanded, setIsListExpanded] = useState(false)

    const panelHeaderOffset = usePanelHeaderOffset()

    const [bounds, setBounds] = useState<Bounds | null>(null)
    const [activePoint, setActivePoint] = useState<CustomerMapPoint | null>(null)
    // Her "Haritada Göster" basışında artar; harita bu sinyalle sonuçlara
    // (seçilen ülke/il/ilçe bölgesine) odaklanır.
    const [focusToken, setFocusToken] = useState(0)
    // "Haritada Göster" basıldıktan sonra harita hedef bölgeye oturana kadar
    // TRUE. Bu sürede istek MEVCUT viewport'la kısıtlanmaz — aksi halde başka
    // bir bölgeye (ör. Ukrayna) bakarken İzmir seçilince kesişim boş çıkardı.
    const [focusPending, setFocusPending] = useState(false)
    const debouncedBounds = useDebouncedBounds(bounds, 320)

    // Geo referans verisi: `GeoAddressFilterFields` ile AYNI query key'ler →
    // cache paylaşılır, ek network yok. Seçilen bölgenin koordinatı "müşteri
    // yoksa bile oraya uç" fallback'i için kullanılır.
    const countriesQuery = useGeoCountries()
    const statesQuery = useGeoStates(countryId ?? undefined)
    const citiesQuery = useGeoCities(stateId ?? undefined)

    const selectedRegion = useMemo(() => {
        const city = cityId ? citiesQuery.data?.find((item) => item.id === cityId) : undefined
        if (city) {
            return {
                name: city.name,
                lat: toFiniteCoord(city.latitude),
                lng: toFiniteCoord(city.longitude),
                zoom: CITY_FOCUS_ZOOM,
            }
        }
        const state = stateId ? statesQuery.data?.find((item) => item.id === stateId) : undefined
        if (state) {
            return {
                name: state.name,
                lat: toFiniteCoord(state.latitude),
                lng: toFiniteCoord(state.longitude),
                zoom: STATE_FOCUS_ZOOM,
            }
        }
        const country = countryId ? countriesQuery.data?.find((item) => item.id === countryId) : undefined
        if (country) {
            return {
                name: country.name,
                lat: toFiniteCoord(country.latitude),
                lng: toFiniteCoord(country.longitude),
                zoom: COUNTRY_FOCUS_ZOOM,
            }
        }
        return null
    }, [cityId, stateId, countryId, citiesQuery.data, statesQuery.data, countriesQuery.data])

    const focusFallback = useMemo(
        () =>
            selectedRegion && selectedRegion.lat !== null && selectedRegion.lng !== null
                ? { lat: selectedRegion.lat, lng: selectedRegion.lng, zoom: selectedRegion.zoom }
                : null,
        [selectedRegion],
    )

    // `handleFocusResolved` stabil kalsın diye bölge adı ref üzerinden okunur.
    const selectedRegionNameRef = useRef<string | null>(null)
    useEffect(() => {
        selectedRegionNameRef.current = selectedRegion?.name ?? null
    }, [selectedRegion])

    const usersQuery = useProtectedUsers({
        page: 1,
        limit: 500,
        accessStatus: "ACTIVE",
    }, allowSalesFilter)

    const attributesQuery = useAttributesForFilter()

    const salesUsers = useMemo(
        () => (usersQuery.data?.data ?? [])
            .filter((user) => user.groups.includes("sales") || user.groups.includes("sales_director"))
            .map((user) => ({
                id: user.id,
                label: getUserDisplayName(user) || user.email,
            }))
            .sort((left, right) => left.label.localeCompare(right.label, "tr")),
        [usersQuery.data?.data],
    )

    const sectorValues = useMemo(
        () => attributesQuery.data?.find((attribute) => attribute.code === "sector")?.values ?? [],
        [attributesQuery.data],
    )
    const usageAreaValues = useMemo(
        () => attributesQuery.data?.find((attribute) => attribute.code === "usage_area")?.values ?? [],
        [attributesQuery.data],
    )

    const filters: CustomerMapFilters = useMemo(
        () => ({
            search,
            status: status === "LEAD" || status === "CUSTOMER" ? status : "ALL",
            assignedSalesUserId: rep,
            sectorValueId: sector,
            usageAreaValueId: usage,
            countryId,
            stateId,
            cityId,
        }),
        [search, status, rep, sector, usage, countryId, stateId, cityId],
    )

    // Ülke varsayılanı Türkiye olduğu için "filtre var mı" sayımına GİRMEZ
    // (LeadCustomers deseni) — aksi halde sayfa her açılışta "filtreli" görünür.
    const hasFilters = Boolean(
        filters.search.trim()
        || filters.status !== "ALL"
        || (allowSalesFilter && filters.assignedSalesUserId !== "ALL")
        || filters.sectorValueId
        || filters.usageAreaValueId
        || filters.stateId
        || filters.cityId,
    )

    function patchFilters(patch: Partial<CustomerMapFilters>) {
        if (patch.search !== undefined) setSearch(patch.search)
        if (patch.status !== undefined) setStatus(patch.status)
        if (patch.assignedSalesUserId !== undefined) setRep(patch.assignedSalesUserId)
        if (patch.sectorValueId !== undefined) setSector(patch.sectorValueId)
        if (patch.usageAreaValueId !== undefined) setUsage(patch.usageAreaValueId)
        if (patch.countryId !== undefined) setCountryId(patch.countryId)
        if (patch.stateId !== undefined) setStateId(patch.stateId)
        if (patch.cityId !== undefined) setCityId(patch.cityId)
        // Değişiklik henüz uygulanmadı: buton tekrar basılana kadar otomatik
        // istek atılmaz.
        setApplied(false)
    }

    function applyFilters() {
        setApplied(true)
        // Yeni segment ÖNCE liste olarak gösterilir; önceki "haritada göster"
        // seçimi/görünümü yeni segmentle anlamsızlaşır.
        setView("list")
        setMapCustomerIds(null)
        selection.clear()
        setListPage(1)
        setIsListExpanded(false)
        setFocusPending(false)
        // İstek mevcut harita viewport'uyla KISITLANMASIN (bölgeler arası
        // geçişte kesişim boş çıkmasın diye — Ukrayna'ya bakarken İzmir seçme
        // senaryosu); liste görünümünde zaten viewport'un bir anlamı yok.
        setBounds(null)
    }

    /**
     * Liste görünümünden harita görünümüne geçiş. `customerIds` `null` ise
     * segmentteki TÜM müşteriler, dolu dizi ise yalnız seçilenler haritada
     * gösterilir. Google Maps JS bu ana kadar hiç yüklenmez.
     */
    function showOnMap(customerIds: string[] | null) {
        setMapCustomerIds(customerIds)
        setView("map")
        // Harita yeni mount edildiği için segmente odaklanmalı.
        setFocusToken((token) => token + 1)
        setFocusPending(true)
        setBounds(null)
    }

    function clearFilters() {
        setSearch("")
        setStatus("ALL")
        setRep("ALL")
        setSector("")
        setUsage("")
        setCountryId(null)
        setStateId(null)
        setCityId(null)
        setApplied(false)
        setView("list")
        setMapCustomerIds(null)
        selection.clear()
        setListPage(1)
        setIsListExpanded(false)
        setFocusPending(false)
    }

    const handleFocusResolved = useCallback(
        ({ pointCount }: { pointCount: number }) => {
            setFocusPending(false)

            if (pointCount === 0) {
                toast.warning(
                    selectedRegionNameRef.current
                        ? `${selectedRegionNameRef.current} için eşleşen müşteri bulunamadı`
                        : "Seçilen filtrelerle eşleşen müşteri bulunamadı",
                    { description: "Filtreleri gevşetip tekrar deneyebilirsiniz." },
                )
                return
            }

            toast.success(
                `${pointCount} müşteri haritada gösteriliyor`,
                pointCount >= MAP_RESULT_LIMIT
                    ? { description: "İlk 500 kayıt gösteriliyor — segmenti daraltabilirsiniz." }
                    : undefined,
            )
        },
        [],
    )

    const mapParams = applied
        ? {
            // Odak beklerken viewport'u GÖNDERME (bkz. applyFilters).
            ...(!focusPending && debouncedBounds ? debouncedBounds : {}),
            ...(filters.status !== "ALL" ? { status: filters.status } : {}),
            ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
            ...(allowSalesFilter && filters.assignedSalesUserId !== "ALL"
                ? { assignedSalesUserId: filters.assignedSalesUserId }
                : {}),
            ...(filters.sectorValueId ? { sectorValueId: filters.sectorValueId } : {}),
            ...(filters.usageAreaValueId ? { usageAreaValueId: filters.usageAreaValueId } : {}),
            ...(filters.countryId ? { countryId: filters.countryId } : {}),
            ...(filters.stateId ? { stateId: filters.stateId } : {}),
            ...(filters.cityId ? { cityId: filters.cityId } : {}),
        }
        : undefined

    const mapQuery = useCustomerMapData(mapParams)
    const points = mapQuery.data ?? EMPTY_POINTS
    const isInitialLoading = mapQuery.isLoading

    // Liste görünümü müşteri bazında tek satır gösterir; harita ADRES bazlı kalır.
    const groups = useMemo(() => groupCustomerMapPoints(points), [points])

    const listTotalPages = Math.max(1, Math.ceil(groups.length / normalizedListLimit))
    // Filtre/sayfa boyutu değişince eski sayfa numarası sınırın dışında kalabilir
    // (ör. 3. sayfadayken sayfa boyutu büyütülürse) — son sayfaya kenetlenir.
    const currentListPage = Math.min(Math.max(1, listPage), listTotalPages)
    const pagedGroups = useMemo(
        () => groups.slice((currentListPage - 1) * normalizedListLimit, currentListPage * normalizedListLimit),
        [groups, currentListPage, normalizedListLimit],
    )
    const pagedGroupIds = useMemo(() => pagedGroups.map((group) => group.customerId), [pagedGroups])
    const pageSelectionState = selection.visibleState(pagedGroupIds)

    // Segment ilk açıldığında (henüz "Tümünü Göster" denmedi) yalnız ilk birkaç
    // müşteri görünür; sayfalama/toplu-seç satırı bu modda anlamsız, gizlenir.
    const isPeeking = !isListExpanded && groups.length > PEEK_CUSTOMER_COUNT
    const visibleGroups = isPeeking ? groups.slice(0, PEEK_CUSTOMER_COUNT) : pagedGroups

    const mapCustomerIdSet = useMemo(
        () => (mapCustomerIds ? new Set(mapCustomerIds) : null),
        [mapCustomerIds],
    )
    const mapPoints = useMemo(
        () => (mapCustomerIdSet ? points.filter((point) => mapCustomerIdSet.has(point.customerId)) : points),
        [points, mapCustomerIdSet],
    )

    const salesUserLabelById = useMemo(
        () => new Map(salesUsers.map((user) => [user.id, user.label])),
        [salesUsers],
    )

    useEffect(() => {
        if (!activePoint) return
        const stillVisible = (mapQuery.data ?? []).some((point) =>
            point.customerId === activePoint.customerId && point.addressId === activePoint.addressId,
        )
        if (!stillVisible) {
            // Meşru senkron: seçili nokta yeni fetch sonucunda artık yoksa
            // (harita sınırları/filtre değişti) seçimi düşürür.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActivePoint(null)
        }
    }, [activePoint, mapQuery.data])

    // Hata bildirimi toast ile (AGENTS.md: kullanıcıya dönük bildirimler Sonner).
    useEffect(() => {
        if (!mapQuery.error) return
        toast.error("Harita verisi yüklenemedi", {
            description:
                mapQuery.error instanceof Error ? mapQuery.error.message : "Lütfen tekrar deneyin.",
        })
    }, [mapQuery.error])

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-950">{title}</h1>
                <p className="text-sm text-neutral-500">{description}</p>
            </div>

            <CustomerMapFilterBar
                filters={filters}
                onChange={patchFilters}
                onApply={applyFilters}
                onClear={clearFilters}
                isDirty={!applied && hasFilters}
                isApplied={applied}
                isFetching={mapQuery.isFetching}
                resultCount={groups.length}
                atResultLimit={points.length >= MAP_RESULT_LIMIT}
                allowSalesFilter={allowSalesFilter}
                salesUsers={salesUsers}
                sectorValues={sectorValues}
                usageAreaValues={usageAreaValues}
            />

            {!applied ? (
                <div className="flex h-40 items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white px-6 text-center text-sm text-neutral-500 shadow-sm">
                    {EMPTY_HINT}
                </div>
            ) : view === "map" ? (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setView("list")}>
                            <List className="h-4 w-4" />
                            Listeye Dön
                        </Button>
                        {mapCustomerIds ? (
                            <span className="text-sm text-neutral-500">
                                Seçilen {mapCustomerIds.length} müşteri gösteriliyor
                            </span>
                        ) : null}
                    </div>

                    <ManagedCustomerMap
                        points={mapPoints}
                        activePoint={activePoint}
                        onActivePointChange={setActivePoint}
                        onBoundsChange={setBounds}
                        customerDetailHref={(customerId) => `${customerDetailBasePath}/${customerId}`}
                        isFetching={mapQuery.isFetching}
                        focusToken={focusToken}
                        focusFallback={focusFallback}
                        onFocusResolved={handleFocusResolved}
                    />
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Liste uzun olabileceği için aksiyonlar (Gizle/Haritada Göster)
                        panel üst çubuğunun HEMEN ALTINDA sabit kalır — sadece bu
                        `space-y-3` sarmalayıcı boyunca (accordion + sayfalama bitene
                        kadar); panel notlarına gelindiğinde normal akışa döner. */}
                    <div
                        className="sticky z-20 space-y-3 rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-sm backdrop-blur"
                        style={{ top: panelHeaderOffset }}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-neutral-500">
                                {groups.length} müşteri
                                {points.length >= MAP_RESULT_LIMIT ? " (ilk 500 adres — segmenti daraltın)" : ""}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {isListExpanded && groups.length > PEEK_CUSTOMER_COUNT ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-2xl"
                                        onClick={() => {
                                            setIsListExpanded(false)
                                            setListPage(1)
                                        }}
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                        Gizle
                                    </Button>
                                ) : null}
                                {selection.selectedCount > 0 ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-2xl"
                                        onClick={() => showOnMap([...selection.selectedIds])}
                                    >
                                        <MapPinned className="h-4 w-4" />
                                        Seçilenleri Haritada Göster ({selection.selectedCount})
                                    </Button>
                                ) : null}
                                <Button
                                    type="button"
                                    className="rounded-2xl"
                                    onClick={() => showOnMap(null)}
                                    disabled={groups.length === 0}
                                >
                                    <MapPinned className="h-4 w-4" />
                                    Tümünü Haritada Göster
                                </Button>
                            </div>
                        </div>

                        {!isPeeking && pagedGroups.length > 0 ? (
                            <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-neutral-600">
                                <Checkbox
                                    checked={
                                        pageSelectionState === "all"
                                            ? true
                                            : pageSelectionState === "some"
                                                ? "indeterminate"
                                                : false
                                    }
                                    onCheckedChange={() => selection.toggleVisible(pagedGroupIds)}
                                />
                                Bu sayfadaki {pagedGroups.length} kaydı seç
                            </label>
                        ) : null}
                    </div>

                    <CustomerMapCustomerAccordion
                        groups={visibleGroups}
                        isPeeking={isPeeking}
                        totalCount={groups.length}
                        onExpandRequest={() => setIsListExpanded(true)}
                        selection={selection}
                        customerDetailHref={(customerId) => `${customerDetailBasePath}/${customerId}`}
                        salesUserLabel={(userId) => salesUserLabelById.get(userId)}
                        isLoading={isInitialLoading}
                        emptyMessage={LIST_EMPTY_MESSAGE}
                        onShowOnMap={(customerId) => showOnMap([customerId])}
                    />

                    {!isPeeking && !isInitialLoading && listTotalPages > 1 ? (
                        <AdminListPagination
                            page={currentListPage}
                            totalPages={listTotalPages}
                            total={groups.length}
                            limit={normalizedListLimit}
                            itemLabel="müşteri"
                            onPageChange={setListPage}
                            onLimitChange={(next) => {
                                setListLimit(next)
                                setListPage(1)
                            }}
                        />
                    ) : null}
                </div>
            )}

            <div className="rounded-3xl border bg-white p-4 shadow-sm">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                    <MapPinned className="h-4 w-4" />
                    Harita Notları
                </div>
                <div className="mt-3 grid gap-3 text-sm leading-6 text-neutral-600 md:grid-cols-3">
                    <p>Filtreler uygulanınca müşteriler önce liste olarak gösterilir; harita yalnız “Haritada Göster”e basınca açılır (Google Maps kullanım maliyetini düşürür).</p>
                    <p>Harita açıldıktan sonra gezdikçe yalnız görünür alandaki müşteriler çağrılır.</p>
                    <p>Popup içinden müşteri detayı ve Google Maps yol tarifi akışına doğrudan geçebilirsiniz.</p>
                </div>
            </div>
        </div>
    )
}
