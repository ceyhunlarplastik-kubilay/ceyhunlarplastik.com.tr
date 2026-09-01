"use client"

import { useEffect } from "react"

import { SearchableSelect } from "@/components/ui/searchable-select"

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
 * (sektör, kullanım alanı) de öyle. Alanlar aranabilir combobox (`SearchableSelect`)
 * — ~250 ülke / 81 il listesinde yazarak filtrelemek gerekiyor.
 */

/** Ülke ISO kodundan çözülür; veri kümesinin sayısal id'si sabit kodlanmaz. */
export const DEFAULT_COUNTRY_ISO2 = "TR"

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
            <SearchableSelect
                aria-label="Ülke"
                value={countryId ? String(countryId) : null}
                // Ülke değişince il ve ilçe ANLAMSIZ kalır — birlikte sıfırlanır.
                onValueChange={(value) =>
                    onChange({
                        countryId: value ? Number(value) : null,
                        stateId: null,
                        cityId: null,
                    })
                }
                options={countries.map((country) => ({
                    value: String(country.id),
                    label: country.name,
                    keywords: country.iso2,
                }))}
                placeholder="Tüm ülkeler"
                searchPlaceholder="Ülke ara"
                loading={countriesQuery.isLoading}
            />

            <SearchableSelect
                aria-label="İl"
                value={stateId ? String(stateId) : null}
                onValueChange={(value) =>
                    onChange({ stateId: value ? Number(value) : null, cityId: null })
                }
                options={(statesQuery.data ?? []).map((state) => ({
                    value: String(state.id),
                    label: state.name,
                }))}
                placeholder={countryId ? "Tüm iller" : "Önce ülke seçin"}
                searchPlaceholder="İl ara"
                disabled={!countryId || statesQuery.isLoading}
                loading={statesQuery.isLoading}
            />

            <SearchableSelect
                aria-label="İlçe"
                value={cityId ? String(cityId) : null}
                onValueChange={(value) => onChange({ cityId: value ? Number(value) : null })}
                options={(citiesQuery.data ?? []).map((city) => ({
                    value: String(city.id),
                    label: city.name,
                }))}
                placeholder={stateId ? "Tüm ilçeler" : "Önce il seçin"}
                searchPlaceholder="İlçe ara"
                disabled={!stateId || citiesQuery.isLoading}
                loading={citiesQuery.isLoading}
            />
        </>
    )
}
