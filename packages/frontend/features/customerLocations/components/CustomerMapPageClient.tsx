"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MapPinned } from "lucide-react"
import { toast } from "sonner"
import { parseAsBoolean, parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { ManagedCustomerMap } from "@/features/customerLocations/components/ManagedCustomerMap"
import {
    CustomerMapFilterBar,
    type CustomerMapFilters,
} from "@/features/customerLocations/components/CustomerMapFilterBar"
import { useCustomerMapData } from "@/features/customerLocations/hooks/useCustomerMapData"
import { useProtectedUsers } from "@/features/customerLocations/hooks/useProtectedUsers"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import { useGeoCities } from "@/features/geo/hooks/useGeoCities"
import { useGeoCountries } from "@/features/geo/hooks/useGeoCountries"
import { useGeoStates } from "@/features/geo/hooks/useGeoStates"
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

const EMPTY_HINT =
    "Segment seçip “Haritada Göster”e basın — müşteri konumları böylece yüklenir."

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

export function CustomerMapPageClient({
    title,
    description,
    customerDetailBasePath,
    allowSalesFilter,
}: Props) {
    // Filtreler URL'de (nuqs): ekran paylaşılabilir, geri tuşu segment seçimini
    // korur. `applied` = kullanıcı bilinçli olarak "Haritada Göster"e bastı mı.
    // Bir filtre değişince `applied` false olur; harita eski noktaları korur ve
    // yeni istek ancak tekrar butona basılınca gider (Google/DB yükü azalır).
    const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""))
    const [status, setStatus] = useQueryState("status", parseAsString.withDefault("ALL"))
    const [rep, setRep] = useQueryState("rep", parseAsString.withDefault("ALL"))
    const [sector, setSector] = useQueryState("sector", parseAsString.withDefault(""))
    const [usage, setUsage] = useQueryState("usage", parseAsString.withDefault(""))
    const [countryId, setCountryId] = useQueryState("country", parseAsInteger)
    const [stateId, setStateId] = useQueryState("state", parseAsInteger)
    const [cityId, setCityId] = useQueryState("city", parseAsInteger)
    const [applied, setApplied] = useQueryState("applied", parseAsBoolean.withDefault(false))

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
        // Değişiklik henüz haritaya uygulanmadı: buton tekrar basılana kadar
        // otomatik istek atılmaz.
        setApplied(false)
    }

    function applyFilters() {
        setApplied(true)
        // Sonuç geldiğinde harita bu segmente odaklansın; o ana kadar istek
        // mevcut viewport'la KISITLANMASIN (bölgeler arası geçişte kesişim boş
        // çıkmasın diye — Ukrayna'ya bakarken İzmir seçme senaryosu).
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
                resultCount={points.length}
                atResultLimit={points.length >= MAP_RESULT_LIMIT}
                allowSalesFilter={allowSalesFilter}
                salesUsers={salesUsers}
                sectorValues={sectorValues}
                usageAreaValues={usageAreaValues}
            />

            <ManagedCustomerMap
                points={points}
                activePoint={activePoint}
                onActivePointChange={setActivePoint}
                onBoundsChange={setBounds}
                customerDetailHref={(customerId) => `${customerDetailBasePath}/${customerId}`}
                isFetching={mapQuery.isFetching}
                emptyHint={applied ? undefined : EMPTY_HINT}
                focusToken={focusToken}
                focusFallback={focusFallback}
                onFocusResolved={handleFocusResolved}
            />

            <div className="rounded-3xl border bg-white p-4 shadow-sm">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                    <MapPinned className="h-4 w-4" />
                    Harita Notları
                </div>
                <div className="mt-3 grid gap-3 text-sm leading-6 text-neutral-600 md:grid-cols-3">
                    <p>Konumlar yalnız “Haritada Göster”e basınca yüklenir; sayfa açılışında harita boş gelir.</p>
                    <p>Segment yüklendikten sonra haritayı gezdikçe yalnız görünür alandaki müşteriler çağrılır.</p>
                    <p>Popup içinden müşteri detayı ve Google Maps yol tarifi akışına doğrudan geçebilirsiniz.</p>
                </div>
            </div>
        </div>
    )
}
