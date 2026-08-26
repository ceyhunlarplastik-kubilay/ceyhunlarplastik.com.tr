"use client"

import { useEffect } from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useGeoCities } from "@/features/geo/hooks/useGeoCities"
import { useGeoCountries } from "@/features/geo/hooks/useGeoCountries"
import { useGeoStates } from "@/features/geo/hooks/useGeoStates"

/**
 * Adres filtresi: ülke → il → ilçe.
 *
 * `GeoAddressFields` (adres FORMU) ile bilinçli olarak ayrı: form alanları
 * zorunlu, doğrulamalı ve harita seçiciyle bağlı; filtre ise her seviyede
 * "tümü" seçilebilir olmalı ve hiçbir alanı zorunlu değil.
 *
 * Filtre normalize FK'lar üzerinden çalışır (görüntü metinleri değil) — indeksli
 * ve metnin nasıl yazıldığından bağımsız.
 *
 * ETİKET YOK, açıklayıcı placeholder var ("Tüm iller"): sayfadaki diğer filtreler
 * (sektör, kullanım alanı) de öyle. Etiket eklemek satır yüksekliklerini
 * ayrıştırıp ızgarayı bozuyordu.
 */

/** Ülke ISO kodundan çözülür; veri kümesinin sayısal id'si sabit kodlanmaz. */
export const DEFAULT_COUNTRY_ISO2 = "TR"

const ALL = "__all__"

type Props = {
    countryId: number | null
    stateId: number | null
    cityId: number | null
    onChange: (patch: { countryId?: number | null; stateId?: number | null; cityId?: number | null }) => void
}

export function GeoAddressFilterFields({ countryId, stateId, cityId, onChange }: Props) {
    const countriesQuery = useGeoCountries()
    const statesQuery = useGeoStates(countryId ?? undefined)
    const citiesQuery = useGeoCities(stateId ?? undefined)

    const countries = countriesQuery.data ?? []

    // Varsayılan ülke: ISO kodundan çözülür. Liste gelene kadar seçim boştur;
    // geldiğinde ve kullanıcı henüz bir ülke seçmemişse Türkiye'ye ayarlanır.
    useEffect(() => {
        if (countryId !== null || countries.length === 0) return

        const fallback = countries.find((country) => country.iso2 === DEFAULT_COUNTRY_ISO2)
        if (fallback) onChange({ countryId: fallback.id })
    }, [countries, countryId, onChange])

    return (
        <>
            <Select
                    value={countryId ? String(countryId) : ALL}
                    onValueChange={(value) =>
                        // Ülke değişince il ve ilçe ANLAMSIZ kalır — birlikte sıfırlanır.
                        onChange({
                            countryId: value === ALL ? null : Number(value),
                            stateId: null,
                            cityId: null,
                        })
                    }
            >
                <SelectTrigger className="h-11 w-full rounded-2xl">
                    <SelectValue placeholder="Tüm ülkeler" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>Tüm ülkeler</SelectItem>
                    {countries.map((country) => (
                        <SelectItem key={country.id} value={String(country.id)}>
                            {country.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                    value={stateId ? String(stateId) : ALL}
                    onValueChange={(value) =>
                        onChange({ stateId: value === ALL ? null : Number(value), cityId: null })
                    }
                disabled={!countryId || statesQuery.isLoading}
            >
                <SelectTrigger className="h-11 w-full rounded-2xl">
                    <SelectValue placeholder={countryId ? "Tüm iller" : "Önce ülke seçin"} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>Tüm iller</SelectItem>
                    {(statesQuery.data ?? []).map((state) => (
                        <SelectItem key={state.id} value={String(state.id)}>
                            {state.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                    value={cityId ? String(cityId) : ALL}
                    onValueChange={(value) => onChange({ cityId: value === ALL ? null : Number(value) })}
                disabled={!stateId || citiesQuery.isLoading}
            >
                <SelectTrigger className="h-11 w-full rounded-2xl">
                    <SelectValue placeholder={stateId ? "Tüm ilçeler" : "Önce il seçin"} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL}>Tüm ilçeler</SelectItem>
                    {(citiesQuery.data ?? []).map((city) => (
                        <SelectItem key={city.id} value={String(city.id)}>
                            {city.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </>
    )
}
