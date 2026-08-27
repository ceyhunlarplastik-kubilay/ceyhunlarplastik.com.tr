"use client"

import { useEffect, useMemo, useState } from "react"
import { Layers, List, MapPinned, Search, Target, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminListPagination } from "@/features/admin/shared/components/AdminListPagination"
import { AdminSectionLoadingOverlay } from "@/features/admin/shared/components/AdminSectionLoadingOverlay"
import { GeoAddressFilterFields } from "@/features/geo/components/GeoAddressFilterFields"
import { ManagedCustomerMap } from "@/features/customerLocations/components/ManagedCustomerMap"
import type { CustomerMapPoint } from "@/features/customerLocations/types"
import { useProductMatchedCustomers } from "@/features/productMatchedCustomers/hooks/useProductMatchedCustomers"
import { ProductMatchedCustomersTable } from "@/features/productMatchedCustomers/components/ProductMatchedCustomersTable"
import type { ProductProfileReachLabel } from "@/features/productMatchedCustomers/api/types"

const TABS = [
    { value: "ALL", label: "Tüm Müşteriler" },
    { value: "CUSTOMER", label: "Cari Müşteriler" },
    { value: "LEAD", label: "Potansiyel Müşteriler" },
] as const

type TabValue = (typeof TABS)[number]["value"]
type ViewMode = "list" | "map"

/** Harita sayfalanmaz: görünen tüm eşleşmeler tek seferde pin'lenir. */
const MAP_LIMIT = 200

/**
 * Pencereye göre yeniden sorgu YOK: liste zaten eşleşme + filtrelerle
 * daraltılmış, harita yalnız onu gösteriyor. Modül seviyesinde SABİT — harita
 * bu callback'i efekt bağımlılığı olarak kullanıyor, her render'da yeni bir
 * fonksiyon vermek efekti boş yere tetiklerdi.
 */
const IGNORE_BOUNDS_CHANGE = () => {}

type GeoFilter = {
    countryId: number | null
    stateId: number | null
    cityId: number | null
}

type Props = {
    productId: string
    productCode: string
    productName: string
    onClose: () => void
    /** Müşteri detayına giden yolun kökü — panel başına değişir. */
    customerBasePath?: string
}

function ReachChips({ label, values }: { label: string; values: ProductProfileReachLabel[] }) {
    if (values.length === 0) return null

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-neutral-500">{label}</span>
            {values.map((value) => (
                <Badge key={value.id} variant="secondary" className="font-normal">
                    {value.name}
                </Badge>
            ))}
        </div>
    )
}

/**
 * ÜRÜN → MÜŞTERİ. Müşteri portalındaki "İlgili Ürünler"in tersi: temsilci
 * satmak istediği ürün modeli için gidebileceği müşteri ve potansiyel müşteri
 * listesini görür.
 *
 * Eşleşme kuralı çekirdekte (`core/helpers/crm/customerProfileMatching.ts`) tek
 * yerde; burada yalnız gösterim var. Kural iki yönde de aynı olduğu için
 * "müşteriye hangi ürünler" ile "ürünü kime satarım" ekranları birbirini tutar.
 *
 * Varyantlar bölümüyle aynı iskelette bir KART: diyalog değil, çünkü temsilci
 * ürün listesi + varyantlar + müşteriler arasında gidip geliyor ve modal her
 * geçişte bağlamı kapatıyordu.
 */
export function ProductMatchedCustomersPanel({
    productId,
    productCode,
    productName,
    onClose,
    customerBasePath = "/satis/musteriler",
}: Props) {
    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")
    const [tab, setTab] = useState<TabValue>("ALL")
    const [view, setView] = useState<ViewMode>("list")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)
    const [geo, setGeo] = useState<GeoFilter>({ countryId: null, stateId: null, cityId: null })
    const [activePoint, setActivePoint] = useState<CustomerMapPoint | null>(null)

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim())
            setPage(1)
        }, 350)

        return () => clearTimeout(timer)
    }, [searchInput])

    const query = useProductMatchedCustomers({
        productId,
        page: view === "map" ? 1 : page,
        limit: view === "map" ? MAP_LIMIT : limit,
        ...(search ? { search } : {}),
        ...(tab === "ALL" ? {} : { status: tab }),
        countryId: geo.countryId,
        stateId: geo.stateId,
        cityId: geo.cityId,
    })

    const customers = useMemo(() => query.data?.data ?? [], [query.data?.data])
    const meta = query.data?.meta
    const counts = query.data?.counts ?? { all: 0, lead: 0, customer: 0 }
    const reach = query.data?.reach
    const hasReach = Boolean(
        reach &&
        (reach.sectors.length > 0 || reach.productionGroups.length > 0 || reach.usageAreas.length > 0),
    )
    const isFirstLoad = query.isLoading && !query.data

    const mapPoints = useMemo<CustomerMapPoint[]>(
        () =>
            customers.flatMap((customer) => {
                const address = customer.address
                if (!address || address.latitude === null || address.longitude === null) return []

                return [{
                    customerId: customer.id,
                    companyName: customer.companyName,
                    fullName: customer.fullName ?? customer.companyName ?? "İsimsiz kayıt",
                    email: customer.email,
                    phone: customer.phone,
                    status: customer.status,
                    addressId: address.id,
                    addressLabel: address.label,
                    addressSummary: address.summary,
                    latitude: address.latitude,
                    longitude: address.longitude,
                    isPrimary: address.isPrimary,
                    isShipping: address.isShipping,
                }]
            }),
        [customers],
    )
    const missingCoordinateCount = customers.length - mapPoints.length

    const tabCounts: Record<TabValue, number> = {
        ALL: counts.all,
        CUSTOMER: counts.customer,
        LEAD: counts.lead,
    }

    const emptyMessage = hasReach
        ? "Bu profile uyan müşteri bulunamadı. Filtreleri gevşetmeyi deneyin."
        : "Ürün modelinin endüstriyel kullanımı tanımlanmadan eşleşme yapılamaz."

    const content = isFirstLoad ? (
        <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
        </div>
    ) : query.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Eşleşen müşteriler yüklenemedi. Lütfen tekrar deneyin.
        </div>
    ) : (
        <div className="relative" aria-busy={query.isFetching}>
            <AdminSectionLoadingOverlay isVisible={query.isFetching && !query.isLoading} />

            {view === "map" ? (
                <div className="space-y-2">
                    <ManagedCustomerMap
                        points={mapPoints}
                        activePoint={activePoint}
                        onActivePointChange={setActivePoint}
                        onBoundsChange={IGNORE_BOUNDS_CHANGE}
                        customerDetailHref={(customerId) => `${customerBasePath}/${customerId}`}
                        isFetching={query.isFetching}
                    />
                    {missingCoordinateCount > 0 ? (
                        <p className="text-xs text-neutral-500">
                            {missingCoordinateCount} eşleşen müşterinin haritada konumu yok (adresine koordinat
                            girilmemiş veya Google konumunun önbellek süresi dolmuş).
                        </p>
                    ) : null}
                    {mapPoints.length === 0 ? (
                        <div className="rounded-xl border border-dashed bg-neutral-50 px-6 py-8 text-center text-sm text-neutral-500">
                            {emptyMessage}
                        </div>
                    ) : null}
                </div>
            ) : (
                <ProductMatchedCustomersTable
                    customers={customers}
                    customerBasePath={customerBasePath}
                    emptyMessage={emptyMessage}
                />
            )}
        </div>
    )

    return (
        <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                    <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-neutral-950">
                        <Target className="h-5 w-5 text-[var(--color-brand)]" />
                        Müşteriler — {productCode}
                    </h2>
                    <p className="text-sm text-neutral-500">
                        {productName} modelinin endüstriyel kullanım profiliyle örtüşen müşteri ve potansiyel
                        müşteriler.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border p-0.5">
                        <Button
                            type="button"
                            size="sm"
                            variant={view === "list" ? "default" : "ghost"}
                            className="gap-1.5"
                            onClick={() => setView("list")}
                        >
                            <List className="h-3.5 w-3.5" />
                            Liste
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={view === "map" ? "default" : "ghost"}
                            className="gap-1.5"
                            onClick={() => setView("map")}
                        >
                            <MapPinned className="h-3.5 w-3.5" />
                            Harita
                        </Button>
                    </div>

                    <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Müşteri listesini kapat">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Eşleşmenin temeli: boş sonuçta bile ekranda kalır ki kullanıcı nedenini görsün. */}
            {hasReach && reach ? (
                <div className="space-y-2 rounded-xl border bg-neutral-50 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600">
                        <Layers className="h-3.5 w-3.5" />
                        Eşleşme temeli
                    </p>
                    <ReachChips label="Sektör" values={reach.sectors} />
                    <ReachChips label="Üretim grubu" values={reach.productionGroups} />
                    <ReachChips label="Kullanım alanı" values={reach.usageAreas} />
                </div>
            ) : null}

            {!isFirstLoad && !hasReach ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Bu ürün modeline endüstriyel kullanım (sektör / üretim grubu / kullanım alanı) tanımlanmamış.
                    Eşleşme bu taksonomi üzerinden kurulduğu için liste boş kalır — ürünün endüstriyel
                    kullanımları girilince müşteriler burada görünür.
                </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="Firma, yetkili, telefon veya e-posta"
                        className="h-11 rounded-2xl pl-9"
                    />
                </div>

                <GeoAddressFilterFields
                    countryId={geo.countryId}
                    stateId={geo.stateId}
                    cityId={geo.cityId}
                    onChange={(patch) => {
                        setGeo((previous) => ({ ...previous, ...patch }))
                        setPage(1)
                    }}
                />
            </div>

            <Tabs
                value={tab}
                onValueChange={(value) => {
                    setTab((TABS.find((item) => item.value === value)?.value) ?? "ALL")
                    setPage(1)
                }}
                className="gap-4"
            >
                <TabsList className="h-auto w-full justify-start gap-1 rounded-[22px] bg-neutral-100/80 p-1">
                    {TABS.map((item) => (
                        <TabsTrigger key={item.value} value={item.value} className="gap-2 rounded-[18px] px-4 py-2 text-sm">
                            <span>{item.label}</span>
                            <span className="rounded-full bg-white/70 px-1.5 text-[11px] font-semibold text-neutral-600">
                                {tabCounts[item.value]}
                            </span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {TABS.map((item) => (
                    <TabsContent key={item.value} value={item.value} className="m-0">
                        {content}
                    </TabsContent>
                ))}
            </Tabs>

            {view === "list" && meta && meta.total > 0 ? (
                <AdminListPagination
                    page={meta.page}
                    totalPages={meta.totalPages}
                    total={meta.total}
                    limit={limit}
                    itemLabel="müşteri"
                    onPageChange={setPage}
                    onLimitChange={(nextLimit) => {
                        setLimit(nextLimit)
                        setPage(1)
                    }}
                />
            ) : null}
        </div>
    )
}
