"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { LoaderCircle, LocateFixed, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AddressDraftFormValues } from "@/features/customerPortal/components/requestComposer/schema"
import { useGeocodingSearch } from "@/features/customerLocations/hooks/useGeocodingSearch"
import { useReverseGeocoding } from "@/features/customerLocations/hooks/useReverseGeocoding"
import type { GeocodeResult } from "@/features/customerLocations/types"

const DynamicLocationMap = dynamic(
    () => import("@/features/customerLocations/components/CustomerLocationPickerMap").then((mod) => mod.CustomerLocationPickerMap),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[320px] items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-500">
                Harita yükleniyor...
            </div>
        ),
    },
)

type Props = {
    value: Pick<
        AddressDraftFormValues,
        "latitude" | "longitude" | "geocodingLabel" | "line1" | "city"
    >
    onChange: (patch: Partial<AddressDraftFormValues>) => void
}

function applyGeocodePatch(result: GeocodeResult, source: "GEOCODED" | "MANUAL_PIN"): Partial<AddressDraftFormValues> {
    return {
        latitude: result.latitude,
        longitude: result.longitude,
        locationSource: source,
        locationAccuracy: result.locationAccuracy,
        geocodingProvider: result.provider,
        geocodingPlaceId: result.providerPlaceId ?? "",
        geocodingLabel: result.label,
        geocodingRaw: result.raw,
        geocodedAt: new Date().toISOString(),
        ...(result.addressParts.country !== undefined ? { country: result.addressParts.country ?? "" } : {}),
        ...(result.addressParts.stateName !== undefined ? { stateName: result.addressParts.stateName ?? "" } : {}),
        ...(result.addressParts.city !== undefined ? { city: result.addressParts.city ?? "" } : {}),
        ...(result.addressParts.district !== undefined ? { district: result.addressParts.district ?? "" } : {}),
        ...(result.addressParts.line1 !== undefined ? { line1: result.addressParts.line1 ?? "" } : {}),
        ...(result.addressParts.postalCode !== undefined ? { postalCode: result.addressParts.postalCode ?? "" } : {}),
        ...(result.addressParts.countryId !== undefined ? { countryId: result.addressParts.countryId ?? null } : {}),
        ...(result.addressParts.stateId !== undefined ? { stateId: result.addressParts.stateId ?? null } : {}),
        ...(result.addressParts.cityId !== undefined ? { cityId: result.addressParts.cityId ?? null } : {}),
    }
}

export function CustomerLocationPicker({ value, onChange }: Props) {
    const [searchInput, setSearchInput] = useState("")
    const [results, setResults] = useState<GeocodeResult[]>([])
    const searchMutation = useGeocodingSearch()
    const reverseMutation = useReverseGeocoding()

    async function handleSearchSubmit() {
        const normalized = searchInput.trim()
        if (!normalized) return
        try {
            const nextResults = await searchMutation.mutateAsync(normalized)
            setResults(nextResults)
        } catch {
            setResults([])
        }
    }

    async function handlePick(latitude: number, longitude: number) {
        onChange({
            latitude,
            longitude,
            locationSource: "MANUAL_PIN",
        })

        try {
            const result = await reverseMutation.mutateAsync({ latitude, longitude })
            if (result) {
                onChange(applyGeocodePatch(result, "MANUAL_PIN"))
            }
        } catch {
            // Keep the manually selected coordinates even if reverse geocoding fails.
        }
    }

    return (
        <div className="space-y-4 rounded-3xl border border-neutral-200 bg-neutral-50/80 p-4">
            <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                    <Search className="h-4 w-4 text-brand" />
                    Konum Seçimi
                </div>
                <p className="text-sm leading-6 text-neutral-500">
                    Adresi aratın veya haritada pini elle bırakın. Kaydederken koordinatlar adresle birlikte saklanır.
                </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Adres, cadde, mahalle veya işletme ara"
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault()
                            void handleSearchSubmit()
                        }
                    }}
                />
                <Button
                    type="button"
                    variant="outline"
                    className="sm:w-auto"
                    disabled={searchMutation.isPending}
                    onClick={() => void handleSearchSubmit()}
                >
                    {searchMutation.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Konum Ara
                </Button>
            </div>

            {results.length > 0 ? (
                <div className="grid gap-2">
                    {results.map((result) => (
                        <button
                            key={`${result.provider}-${result.providerPlaceId ?? result.label}`}
                            type="button"
                            onClick={() => {
                                onChange(applyGeocodePatch(result, "GEOCODED"))
                                setResults([])
                            }}
                            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left transition hover:border-brand/40 hover:bg-brand/5"
                        >
                            <div className="text-sm font-medium text-neutral-900">{result.label}</div>
                            <div className="mt-1 text-xs text-neutral-500">
                                {result.addressParts.line1 || value.line1 || "Adres detayı bulunamadı"}
                                {result.addressParts.city ? ` · ${result.addressParts.city}` : ""}
                            </div>
                        </button>
                    ))}
                </div>
            ) : null}

            {searchMutation.error ? (
                <p className="text-sm text-red-600">
                    {searchMutation.error instanceof Error ? searchMutation.error.message : "Adres araması başarısız oldu."}
                </p>
            ) : null}

            {reverseMutation.error ? (
                <p className="text-sm text-amber-700">
                    {reverseMutation.error instanceof Error
                        ? reverseMutation.error.message
                        : "Konum seçildi fakat ters geocode bilgisi alınamadı."}
                </p>
            ) : null}

            <DynamicLocationMap
                latitude={value.latitude}
                longitude={value.longitude}
                onPick={(latitude, longitude) => void handlePick(latitude, longitude)}
            />

            <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="font-medium text-neutral-900">
                        {value.geocodingLabel?.trim() || "Seçili konum bekleniyor"}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                        Haritaya tıklayarak veya pini sürükleyerek konumu güncelleyebilirsiniz.
                    </div>
                </div>
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-neutral-400">
                    <LocateFixed className="h-4 w-4" />
                    {value.latitude != null && value.longitude != null
                        ? `${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}`
                        : "Koordinat seçilmedi"}
                </div>
            </div>
        </div>
    )
}
