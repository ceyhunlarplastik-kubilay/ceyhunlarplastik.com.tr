"use client"

import { useState } from "react"
import { LocateFixed, MapPinPlus, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchInput, setSearchInput] = useState("")
    const [submittedQuery, setSubmittedQuery] = useState("")
    const [requestId, setRequestId] = useState(0)

    function submitSearch() {
        const query = searchInput.trim()
        if (!query) return
        setSubmittedQuery(query)
        setRequestId((current) => current + 1)
    }

    function handlePlaceSelect(selection: GooglePlaceSelection) {
        onSelect({
            refId: `place:${selection.placeId}`,
            lat: selection.latitude,
            lng: selection.longitude,
            label: selection.displayName?.trim() || submittedQuery.trim(),
            source: "SEARCH",
        })
        setSearchOpen(false)
        setSearchInput("")
        setSubmittedQuery("")
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
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{roleLabel}</span>
                <div className="flex items-center gap-1">
                    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                        <PopoverTrigger asChild>
                            <Button type="button" size="icon" variant="ghost" className="h-6 w-6" aria-label={`${roleLabel} için adres ara`}>
                                <Search className="h-3.5 w-3.5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-72 space-y-2">
                            <div className="flex gap-1.5">
                                <Input
                                    value={searchInput}
                                    onChange={(event) => setSearchInput(event.target.value)}
                                    placeholder="Firma adı veya adres"
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault()
                                            submitSearch()
                                        }
                                    }}
                                />
                                <Button type="button" size="icon" variant="outline" onClick={submitSearch} aria-label="Ara">
                                    <Search className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            {submittedQuery ? (
                                <GooglePlacesSearch
                                    query={submittedQuery}
                                    requestId={requestId}
                                    onSelect={handlePlaceSelect}
                                    onError={(message) => toast.error(message)}
                                />
                            ) : null}
                        </PopoverContent>
                    </Popover>
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        aria-label={`${roleLabel} için mevcut konumu kullan`}
                        onClick={goToBrowserLocation}
                    >
                        <LocateFixed className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        type="button"
                        size="icon"
                        variant={picking ? "default" : "ghost"}
                        className="h-6 w-6"
                        aria-label={picking ? `${roleLabel} seçimini iptal et` : `${roleLabel} için haritadan seç`}
                        onClick={picking ? onDisarmPicking : onArmPicking}
                    >
                        <MapPinPlus className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <div className="truncate rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-sm text-neutral-800">
                {picking ? "Haritada bir nokta seçin..." : point?.label || "Seçilmedi"}
            </div>
        </div>
    )
}
