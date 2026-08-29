"use client"

import { useState } from "react"
import { LocateFixed, MapPinPlus, Search, X } from "lucide-react"
import { toast } from "sonner"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { GooglePlacesSearch, type GooglePlaceSelection } from "@/features/customerLocations/components/GooglePlacesSearch"
import type { RoutePoint } from "@/features/customerLocations/routePlanning/types"

type Props = {
    roleLabel: string
    point: RoutePoint | null
    picking: boolean
    onArmPicking: () => void
    onDisarmPicking: () => void
    onSelect: (point: RoutePoint) => void
}

export function RouteEndpointPicker({ roleLabel, point, picking, onArmPicking, onDisarmPicking, onSelect }: Props) {
    const [searchInput, setSearchInput] = useState(point?.label ?? "")
    const [submittedQuery, setSubmittedQuery] = useState("")
    const [requestId, setRequestId] = useState(0)
    const [syncedPointRefId, setSyncedPointRefId] = useState(point?.refId ?? null)

    // Nokta arama sonucundan, mevcut konumdan veya haritadan seçilerek belirlenince
    // (üçü de sonunda `point` prop'unu değiştiriyor) arama kutusu seçilen noktanın
    // adını göstermeli — aksi halde kutu boşmuş gibi görünüp seçim yapılmamış izlenimi
    // veriyordu. useEffect+setState yerine render sırasında state ayarlıyoruz (React'ın
    // "prop değişince state'i uyarla" deseni) — repo'nun eslint kuralı efekt içinde
    // senkron setState'i hata sayıyor.
    if ((point?.refId ?? null) !== syncedPointRefId) {
        setSyncedPointRefId(point?.refId ?? null)
        setSearchInput(point?.label ?? "")
        setSubmittedQuery("")
    }

    function submitSearch() {
        const query = searchInput.trim()
        if (!query) return
        setSubmittedQuery(query)
        setRequestId((current) => current + 1)
    }

    function clearSearch() {
        setSearchInput("")
        setSubmittedQuery("")
    }

    function handlePlaceSelect(selection: GooglePlaceSelection) {
        onSelect({
            refId: `place:${selection.placeId}`,
            lat: selection.latitude,
            lng: selection.longitude,
            label: selection.displayName?.trim() || submittedQuery.trim(),
            source: "SEARCH",
        })
        // searchInput'u burada temizlemiyoruz: `point` değişince yukarıdaki effect
        // arama kutusuna seçilen noktanın adını yazacak.
    }

    function goToBrowserLocation() {
        if (!navigator.geolocation) {
            toast.error("Tarayıcınız konum özelliğini desteklemiyor.")
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                onSelect({
                    refId: "current-location",
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    label: "Mevcut Konumum",
                    source: "CURRENT_LOCATION",
                })
            },
            () => toast.error("Tarayıcı konumu alınamadı. İzinleri kontrol edin."),
            { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
        )
    }

    return (
        <TooltipProvider>
            <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                    <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-neutral-500">{roleLabel}</span>
                    <span className="truncate text-xs text-neutral-600">
                        {picking ? "Haritada bir nokta seçin..." : point?.label || "Seçilmedi"}
                    </span>
                </div>

                <InputGroup>
                    <InputGroupAddon>
                        <Search className="h-3.5 w-3.5" />
                    </InputGroupAddon>
                    <InputGroupInput
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="Firma adı veya adres ara"
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault()
                                submitSearch()
                            }
                        }}
                    />
                    <InputGroupAddon align="inline-end">
                        {searchInput ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <InputGroupButton size="icon-xs" aria-label="Aramayı temizle" onClick={clearSearch}>
                                        <X className="h-3.5 w-3.5" />
                                    </InputGroupButton>
                                </TooltipTrigger>
                                <TooltipContent>Aramayı temizle</TooltipContent>
                            </Tooltip>
                        ) : null}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <InputGroupButton
                                    size="icon-xs"
                                    aria-label={`${roleLabel} için mevcut konumu kullan`}
                                    onClick={goToBrowserLocation}
                                >
                                    <LocateFixed className="h-3.5 w-3.5" />
                                </InputGroupButton>
                            </TooltipTrigger>
                            <TooltipContent>Mevcut konumumu kullan</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <InputGroupButton
                                    size="icon-xs"
                                    variant={picking ? "default" : "ghost"}
                                    aria-label={picking ? `${roleLabel} seçimini iptal et` : `${roleLabel} için haritadan seç`}
                                    onClick={picking ? onDisarmPicking : onArmPicking}
                                >
                                    <MapPinPlus className="h-3.5 w-3.5" />
                                </InputGroupButton>
                            </TooltipTrigger>
                            <TooltipContent>{picking ? "Haritadan seçimi iptal et" : "Haritadan seç"}</TooltipContent>
                        </Tooltip>
                    </InputGroupAddon>
                </InputGroup>

                {submittedQuery ? (
                    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-1.5">
                        <GooglePlacesSearch
                            query={submittedQuery}
                            requestId={requestId}
                            onSelect={handlePlaceSelect}
                            onError={(message) => toast.error(message)}
                        />
                    </div>
                ) : null}
            </div>
        </TooltipProvider>
    )
}
