"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, MapPinned } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useGeoCities } from "@/features/geo/hooks/useGeoCities"
import { useGeoCountries } from "@/features/geo/hooks/useGeoCountries"
import { useGeoStates } from "@/features/geo/hooks/useGeoStates"
import { cn } from "@/lib/utils"

type Props = {
    countryId?: number | null
    stateId?: number | null
    cityId?: number | null
    onChange: (patch: {
        countryId?: number | null
        stateId?: number | null
        cityId?: number | null
        country?: string
        stateName?: string
        city?: string
    }) => void
}

type SearchableOption = {
    id: number
    name: string
}

type SearchableGeoSelectProps = {
    disabled?: boolean
    emptyLabel: string
    loading?: boolean
    onSelect: (option: SearchableOption | null) => void
    options: SearchableOption[]
    placeholder: string
    searchPlaceholder: string
    title: string
    value?: number | null
}

function SearchableGeoSelect({
    disabled = false,
    emptyLabel,
    loading = false,
    onSelect,
    options,
    placeholder,
    searchPlaceholder,
    title,
    value,
}: SearchableGeoSelectProps) {
    const [open, setOpen] = useState(false)
    const selectedOption = options.find((option) => option.id === value) ?? null

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral-800">{title}</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn(
                            "h-11 w-full justify-between rounded-xl border-neutral-200 bg-white px-3 font-normal text-neutral-900 shadow-none",
                            !selectedOption && "text-neutral-500",
                            disabled && "bg-neutral-100 text-neutral-400",
                        )}
                    >
                        <span className="truncate">
                            {selectedOption?.name ?? placeholder}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 text-neutral-400" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder={searchPlaceholder} />
                        <CommandList>
                            <CommandEmpty>
                                {loading ? "Yükleniyor..." : emptyLabel}
                            </CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value={`__empty__-${title}`}
                                    onSelect={() => {
                                        onSelect(null)
                                        setOpen(false)
                                    }}
                                >
                                    <Check className={cn("h-4 w-4", !selectedOption ? "opacity-100" : "opacity-0")} />
                                    {placeholder}
                                </CommandItem>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.id}
                                        value={`${option.name} ${option.id}`}
                                        onSelect={() => {
                                            onSelect(option)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check className={cn("h-4 w-4", selectedOption?.id === option.id ? "opacity-100" : "opacity-0")} />
                                        {option.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}

export function GeoAddressFields({
    countryId,
    stateId,
    cityId,
    onChange,
}: Props) {
    const countriesQuery = useGeoCountries()
    const statesQuery = useGeoStates(countryId)
    const citiesQuery = useGeoCities(stateId)

    const countries = countriesQuery.data ?? []
    const states = statesQuery.data ?? []
    const cities = citiesQuery.data ?? []

    return (
        <>
            <SearchableGeoSelect
                title="Ülke"
                value={countryId}
                options={countries}
                loading={countriesQuery.isLoading}
                placeholder={countriesQuery.isLoading ? "Ülkeler yükleniyor..." : "Ülke seç"}
                searchPlaceholder="Ülke ara..."
                emptyLabel="Sonuç bulunamadı."
                onSelect={(selectedCountry) => {
                    if (!selectedCountry) {
                        onChange({
                            countryId: null,
                            stateId: null,
                            cityId: null,
                            country: "",
                            stateName: "",
                            city: "",
                        })
                        return
                    }

                    onChange({
                        countryId: selectedCountry.id,
                        stateId: null,
                        cityId: null,
                        country: selectedCountry.name,
                        stateName: "",
                        city: "",
                    })
                }}
            />

            <SearchableGeoSelect
                title="İl"
                value={stateId}
                disabled={!countryId}
                options={states}
                loading={statesQuery.isLoading}
                placeholder={!countryId ? "Önce ülke seçin" : statesQuery.isLoading ? "İller yükleniyor..." : "İl seç"}
                searchPlaceholder="İl ara..."
                emptyLabel={!countryId ? "Önce ülke seçin." : "Sonuç bulunamadı."}
                onSelect={(selectedState) => {
                    if (!selectedState) {
                        onChange({
                            stateId: null,
                            cityId: null,
                            stateName: "",
                            city: "",
                        })
                        return
                    }

                    onChange({
                        stateId: selectedState.id,
                        stateName: selectedState.name,
                        cityId: null,
                        city: "",
                    })
                }}
            />

            <SearchableGeoSelect
                title="İlçe"
                value={cityId}
                disabled={!stateId}
                options={cities}
                loading={citiesQuery.isLoading}
                placeholder={!stateId ? "Önce il seçin" : citiesQuery.isLoading ? "İlçeler yükleniyor..." : "İlçe seç"}
                searchPlaceholder="İlçe ara..."
                emptyLabel={!stateId ? "Önce il seçin." : "Sonuç bulunamadı."}
                onSelect={(selectedCity) => {
                    if (!selectedCity) {
                        onChange({
                            cityId: null,
                            city: "",
                        })
                        return
                    }

                    onChange({
                        cityId: selectedCity.id,
                        city: selectedCity.name,
                    })
                }}
            />

            {!countryId ? (
                <div className="col-span-full rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                    <div className="flex items-center gap-2">
                        <MapPinned className="h-3.5 w-3.5" />
                        Ülke seçimi yapılmadan il ve ilçe alanları açılmaz.
                    </div>
                </div>
            ) : null}
        </>
    )
}
