"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPinned, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ManagedCustomerMap } from "@/features/customerLocations/components/ManagedCustomerMap"
import { useCustomerMapData } from "@/features/customerLocations/hooks/useCustomerMapData"
import { useProtectedUsers } from "@/features/customerLocations/hooks/useProtectedUsers"
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
    const [bounds, setBounds] = useState<Bounds | null>(null)
    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState<"LEAD" | "CUSTOMER" | "ALL">("ALL")
    const [assignedSalesUserId, setAssignedSalesUserId] = useState<string>("ALL")
    const [activePoint, setActivePoint] = useState<CustomerMapPoint | null>(null)
    const debouncedBounds = useDebouncedBounds(bounds, 320)

    const usersQuery = useProtectedUsers({
        page: 1,
        limit: 500,
        accessStatus: "ACTIVE",
    }, allowSalesFilter)

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

    const mapQuery = useCustomerMapData(debouncedBounds
        ? {
            ...debouncedBounds,
            ...(status !== "ALL" ? { status } : {}),
            ...(search ? { search } : {}),
            ...(allowSalesFilter && assignedSalesUserId !== "ALL" ? { assignedSalesUserId } : {}),
        }
        : undefined)

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

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-950">{title}</h1>
                <p className="text-sm text-neutral-500">{description}</p>
            </div>

            <div className="grid gap-3 rounded-3xl border bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1.2fr)_200px_220px_auto]">
                <div className="flex gap-2">
                    <Input
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="Firma, kişi veya e-posta ara"
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault()
                                setSearch(searchInput.trim())
                            }
                        }}
                    />
                    <Button type="button" variant="outline" onClick={() => setSearch(searchInput.trim())}>
                        <Search className="mr-2 h-4 w-4" />
                        Filtrele
                    </Button>
                </div>

                <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Durum" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                        <SelectItem value="CUSTOMER">Müşteriler</SelectItem>
                        <SelectItem value="LEAD">Potansiyeller</SelectItem>
                    </SelectContent>
                </Select>

                {allowSalesFilter ? (
                    <Select value={assignedSalesUserId} onValueChange={setAssignedSalesUserId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Satış temsilcisi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tüm Temsilciler</SelectItem>
                            {salesUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="hidden lg:block" />
                )}

                <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-600">
                    <span className="inline-flex items-center gap-2">
                        <Users className="h-4 w-4 text-brand" />
                        Görünen kayıt
                    </span>
                    <span className="font-semibold text-neutral-900">{mapQuery.data?.length ?? 0}</span>
                </div>
            </div>

            <ManagedCustomerMap
                points={mapQuery.data ?? []}
                activePoint={activePoint}
                onActivePointChange={setActivePoint}
                onBoundsChange={setBounds}
                customerDetailHref={(customerId) => `${customerDetailBasePath}/${customerId}`}
                isFetching={mapQuery.isFetching}
            />

            {mapQuery.error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {mapQuery.error instanceof Error ? mapQuery.error.message : "Harita verisi yüklenemedi."}
                </div>
            ) : null}

            <div className="rounded-3xl border bg-white p-4 shadow-sm">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-400">
                    <MapPinned className="h-4 w-4" />
                    Harita Notları
                </div>
                <div className="mt-3 grid gap-3 text-sm leading-6 text-neutral-600 md:grid-cols-3">
                    <p>Haritayı hareket ettirdikçe sadece görünür alan içindeki koordinatlı müşteriler çağrılır.</p>
                    <p>Aynı bölgede yoğun kayıt olduğunda cluster açılır; tıklayınca harita o bölgeye yaklaşır.</p>
                    <p>Popup içinden müşteri detayı ve Google Maps yol tarifi akışına doğrudan geçebilirsiniz.</p>
                </div>
            </div>
        </div>
    )
}
