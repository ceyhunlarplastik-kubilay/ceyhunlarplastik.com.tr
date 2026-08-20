"use client"

import dynamic from "next/dynamic"
import { useCallback, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ExternalLink, LocateFixed, MapPin, Search } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoogleMapsApiProvider, googleMapsBrowserApiKey, googleMapsMapId } from "@/features/customerLocations/components/GoogleMapsApiProvider"
import { GooglePlacesSearch, type GooglePlaceSelection } from "@/features/customerLocations/components/GooglePlacesSearch"
import { getGeoCities } from "@/features/geo/api/getGeoCities"
import { getGeoCountries } from "@/features/geo/api/getGeoCountries"
import { getGeoStates } from "@/features/geo/api/getGeoStates"
import { buildGoogleMapsTextSearchUrl } from "@/features/customerLocations/lib/buildGoogleMapsDirectionsUrl"
import { matchGeoCountry, matchGeoOption } from "@/features/customerLocations/lib/googlePlaceAddress"
import { normalizeCoordinateValue, parseManualCoordinates } from "@/features/customerLocations/lib/manualCoordinates"
import type { AddressDraftFormValues } from "@/features/customerPortal/components/requestComposer/schema"

const DynamicLocationMap = dynamic(
    () => import("@/features/customerLocations/components/CustomerLocationPickerMap").then((mod) => mod.CustomerLocationPickerMap),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-80 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-sm text-neutral-500">
                Google Maps yükleniyor...
            </div>
        ),
    },
)

type Props = {
    value: Pick<
        AddressDraftFormValues,
        "latitude" | "longitude" | "phone" | "line1" | "city" | "country" | "stateName" | "geocodingProvider" | "geocodingPlaceId"
    >
    onChange: (patch: Partial<AddressDraftFormValues>) => void
}

function manualLocationPatch(latitude: number, longitude: number): Partial<AddressDraftFormValues> {
    return {
        latitude,
        longitude,
        locationSource: "MANUAL_PIN",
        locationAccuracy: "EXACT",
        geocodingProvider: "",
        geocodingPlaceId: "",
        geocodingLabel: "",
        geocodingRaw: undefined,
        geocodedAt: "",
    }
}

export function CustomerLocationPicker({ value, onChange }: Props) {
    const queryClient = useQueryClient()
    const prefersReducedMotion = useReducedMotion()
    const geoResolutionRequestRef = useRef(0)
    const selectedLatitude = normalizeCoordinateValue(value.latitude, -90, 90)
    const selectedLongitude = normalizeCoordinateValue(value.longitude, -180, 180)
    const [searchInput, setSearchInput] = useState("")
    const [submittedQuery, setSubmittedQuery] = useState("")
    const [requestId, setRequestId] = useState(0)
    const [mapError, setMapError] = useState<string | null>(null)
    const [manualError, setManualError] = useState<string | null>(null)
    const [addressNotice, setAddressNotice] = useState<{
        tone: "success" | "warning"
        message: string
    } | null>(null)
    const [selectedPlaceName, setSelectedPlaceName] = useState<string | null>(null)
    const [latitudeText, setLatitudeText] = useState(selectedLatitude?.toString() ?? "")
    const [longitudeText, setLongitudeText] = useState(selectedLongitude?.toString() ?? "")

    const hasGoogleConfiguration = Boolean(googleMapsBrowserApiKey && googleMapsMapId)
    const externalQuery = useMemo(() => [
        searchInput.trim(),
        value.line1?.trim(),
        value.city?.trim(),
        value.stateName?.trim(),
        value.country?.trim(),
    ].filter(Boolean).join(", ") || "Ceyhunlar Plastik", [searchInput, value.city, value.country, value.line1, value.stateName])

    const handlePlaceSelect = useCallback(async (selection: GooglePlaceSelection) => {
        const geoResolutionRequestId = ++geoResolutionRequestRef.current
        setMapError(null)
        setAddressNotice(null)
        setSelectedPlaceName(selection.displayName?.trim() || submittedQuery.trim() || null)
        setLatitudeText(selection.latitude.toString())
        setLongitudeText(selection.longitude.toString())
        onChange({
            latitude: selection.latitude,
            longitude: selection.longitude,
            locationSource: "GEOCODED",
            locationAccuracy: "EXACT",
            geocodingProvider: "google_places",
            geocodingPlaceId: selection.placeId,
            // Google'ın sonuç kartındaki işletme etiketi ve ham yanıt saklanmaz.
            // Kullanıcının kontrol ettiği ayrıştırılmış adres alanları CRM taslağına yazılır.
            geocodingLabel: "",
            geocodingRaw: undefined,
            geocodedAt: new Date().toISOString(),
            ...(selection.address
                ? {
                    line1: selection.address.line1 ?? "",
                    district: selection.address.district ?? "",
                    postalCode: selection.address.postalCode ?? "",
                }
                : {}),
            ...(selection.phone && !value.phone?.trim() ? { phone: selection.phone } : {}),
            ...(selection.address?.countryName
                ? {
                    countryId: null,
                    stateId: null,
                    cityId: null,
                    country: "",
                    stateName: "",
                    city: "",
                }
                : {}),
        })

        if (!selection.address?.countryName && !selection.address?.countryCode) return

        try {
            const countries = await queryClient.fetchQuery({
                queryKey: ["geo-countries"],
                queryFn: getGeoCountries,
                staleTime: 1000 * 60 * 60 * 24,
            })
            const country = matchGeoCountry(countries, selection.address)

            if (!country) {
                if (geoResolutionRequestId !== geoResolutionRequestRef.current) return
                setAddressNotice({
                    tone: "warning",
                    message: "Google adresi alındı fakat ülke kendi konum verilerimizle eşleşmedi. Ülke, il ve ilçeyi kontrol edin.",
                })
                return
            }

            const states = await queryClient.fetchQuery({
                queryKey: ["geo-states", country.id],
                queryFn: () => getGeoStates(country.id),
                staleTime: 1000 * 60 * 60 * 24,
            })
            const state = matchGeoOption(states, selection.address.stateName)
            const cities = state
                ? await queryClient.fetchQuery({
                    queryKey: ["geo-cities", state.id],
                    queryFn: () => getGeoCities(state.id),
                    staleTime: 1000 * 60 * 60 * 24,
                })
                : []
            const city = matchGeoOption(cities, selection.address.cityName)

            if (geoResolutionRequestId !== geoResolutionRequestRef.current) return

            onChange({
                countryId: country.id,
                country: country.name,
                stateId: state?.id ?? null,
                stateName: state?.name ?? "",
                cityId: city?.id ?? null,
                city: city?.name ?? "",
            })
            setAddressNotice({
                tone: state && city ? "success" : "warning",
                message: state && city
                    ? "Ülke, il, ilçe ve bulunan adres alanları otomatik dolduruldu. Kaydetmeden önce kontrol edin."
                    : "Adres alanları dolduruldu; eşleşmeyen il veya ilçeyi kendi konum listemizden seçin.",
            })
        } catch {
            if (geoResolutionRequestId !== geoResolutionRequestRef.current) return
            setAddressNotice({
                tone: "warning",
                message: "Adres alanları alındı fakat ülke, il ve ilçe eşleştirmesi tamamlanamadı. Seçimleri elle kontrol edin.",
            })
        }
    // Bağımlılıkta `searchInput` DEĞİL `submittedQuery` var: her tuş vuruşunda
    // kimlik değişseydi GooglePlacesSearch efekti sonuç listesini söküp atardı.
    // `submittedQuery` yalnız arama gönderildiğinde değişir; o anda `requestId`
    // de artar ve liste zaten yeniden doldurulur.
    }, [onChange, queryClient, submittedQuery, setAddressNotice, setLatitudeText, setLongitudeText, setMapError, setSelectedPlaceName, value.phone])

    const handlePlacesError = useCallback((message: string) => setMapError(message), [setMapError])

    function applyManualLocation(latitude: number, longitude: number) {
        geoResolutionRequestRef.current += 1
        setAddressNotice(null)
        setSelectedPlaceName(null)
        setLatitudeText(latitude.toString())
        setLongitudeText(longitude.toString())
        onChange(manualLocationPatch(latitude, longitude))
    }

    function submitSearch() {
        const query = [searchInput.trim(), value.city?.trim(), value.country?.trim()]
            .filter(Boolean)
            .join(", ")
        if (!query) return
        setMapError(null)
        setAddressNotice(null)
        setSubmittedQuery(query)
        setRequestId((current) => current + 1)
    }

    function applyManualCoordinates() {
        const parsed = parseManualCoordinates(latitudeText, longitudeText)
        if (!parsed.success) {
            setManualError(parsed.message)
            return
        }
        setManualError(null)
        applyManualLocation(parsed.latitude, parsed.longitude)
    }

    function goToBrowserLocation() {
        if (!navigator.geolocation) {
            setManualError("Tarayıcınız konum özelliğini desteklemiyor.")
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setManualError(null)
                applyManualLocation(position.coords.latitude, position.coords.longitude)
            },
            () => setManualError("Tarayıcı konumu alınamadı. İzinleri kontrol edin veya koordinatı elle girin."),
            { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
        )
    }

    return (
        <div className="space-y-4 rounded-3xl border border-neutral-200 bg-neutral-50/80 p-4">
            <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
                    <Search className="h-4 w-4 text-brand" />
                    Google ile Firma veya Adres Ara
                </div>
                <p className="text-sm leading-6 text-neutral-500">
                    Google sonucu konumu ve adres alanlarını doldurmak için kullanılır. Kaydetmeden önce bilgileri kontrol edin.
                </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Firma adı veya tam adres"
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault()
                            submitSearch()
                        }
                    }}
                />
                <Button type="button" variant="outline" className="sm:w-auto" disabled={!hasGoogleConfiguration} onClick={submitSearch}>
                    <Search className="mr-2 h-4 w-4" />
                    Konum Ara
                </Button>
            </div>

            {hasGoogleConfiguration ? (
                <GoogleMapsApiProvider onError={() => setMapError("Google Maps yüklenemedi. Manuel konum seçeneklerini kullanabilirsiniz.")}>
                    {submittedQuery ? (
                        <GooglePlacesSearch
                            query={submittedQuery}
                            requestId={requestId}
                            onSelect={handlePlaceSelect}
                            onError={handlePlacesError}
                        />
                    ) : null}
                    <DynamicLocationMap
                        latitude={selectedLatitude}
                        longitude={selectedLongitude}
                        googlePlaceId={value.geocodingProvider === "google_places" ? value.geocodingPlaceId : null}
                        placeLabel={selectedPlaceName}
                        onPick={applyManualLocation}
                    />
                </GoogleMapsApiProvider>
            ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
                    Google Maps anahtarı veya Map ID tanımlı değil. Adresi yazmaya devam edip koordinatı elle ya da tarayıcı konumuyla ekleyebilirsiniz.
                </div>
            )}

            {mapError ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
                    {mapError} Form kilitlenmedi; aşağıdaki ücretsiz alternatifleri kullanabilirsiniz.
                </div>
            ) : null}

            <AnimatePresence initial={false}>
                {addressNotice ? (
                    <motion.div
                        key={`${addressNotice.tone}-${addressNotice.message}`}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        className={addressNotice.tone === "success"
                            ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                            : "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"}
                        role="status"
                        aria-live="polite"
                    >
                        {addressNotice.message}
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <div className="space-y-3 rounded-2xl border border-dashed border-neutral-200 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-sm font-medium text-neutral-900">Manuel konum seçenekleri</div>
                        <div className="mt-1 text-xs text-neutral-500">Google çalışmasa veya kota dolsa bile adres kaydı tamamlanabilir.</div>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={goToBrowserLocation}>
                        <LocateFixed className="mr-2 h-4 w-4" />
                        Tarayıcı Konumum
                    </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <Input
                        inputMode="decimal"
                        value={latitudeText}
                        onChange={(event) => setLatitudeText(event.target.value)}
                        placeholder="Enlem (örn. 41.0082)"
                        aria-label="Enlem"
                    />
                    <Input
                        inputMode="decimal"
                        value={longitudeText}
                        onChange={(event) => setLongitudeText(event.target.value)}
                        placeholder="Boylam (örn. 28.9784)"
                        aria-label="Boylam"
                    />
                    <Button type="button" variant="outline" onClick={applyManualCoordinates}>
                        <MapPin className="mr-2 h-4 w-4" />
                        Uygula
                    </Button>
                </div>

                {manualError ? <p className="text-sm text-red-600" role="alert">{manualError}</p> : null}

                <div className="flex flex-col gap-2 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        {selectedLatitude !== null && selectedLongitude !== null
                            ? `Seçili koordinat: ${selectedLatitude.toFixed(6)}, ${selectedLongitude.toFixed(6)}`
                            : "Henüz koordinat seçilmedi."}
                    </span>
                    <a
                        href={buildGoogleMapsTextSearchUrl(externalQuery)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                    >
                        Google Maps’te Ara
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </div>
            </div>
        </div>
    )
}
