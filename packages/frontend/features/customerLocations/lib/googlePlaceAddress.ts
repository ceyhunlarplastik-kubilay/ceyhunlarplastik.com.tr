export type GoogleAddressComponentLike = {
    longText: string | null
    shortText: string | null
    types: string[]
}

export type GooglePlaceAddressDraft = {
    countryCode?: string
    countryName?: string
    stateName?: string
    cityName?: string
    district?: string
    line1?: string
    postalCode?: string
}

type GeoOption = {
    id: number
    name: string
}

type GeoCountryOption = GeoOption & {
    iso2: string
}

function componentByType(components: GoogleAddressComponentLike[], type: string) {
    return components.find((component) => component.types.includes(type))
}

function longText(components: GoogleAddressComponentLike[], ...types: string[]) {
    for (const type of types) {
        const value = componentByType(components, type)?.longText?.trim()
        if (value) return value
    }
    return undefined
}

export function parseGooglePlaceAddress(
    components: GoogleAddressComponentLike[],
    formattedAddress?: string | null,
): GooglePlaceAddressDraft {
    const country = componentByType(components, "country")
    const countryCode = country?.shortText?.trim().toUpperCase()
    const streetAddress = longText(components, "street_address")
    const route = longText(components, "route")
    const streetNumber = longText(components, "street_number")
    const premise = longText(components, "premise")
    const subpremise = longText(components, "subpremise")
    const postalCode = longText(components, "postal_code")
    const postalCodeSuffix = longText(components, "postal_code_suffix")

    const routeAddress = [route, streetNumber].filter(Boolean).join(" ")
    const premiseAddress = [premise, subpremise].filter(Boolean).join(" ")
    // İşletme kayıtlarında Google bazen route/street_number bileşenlerini
    // eksik döndürür. `formattedAddress` kullanıcıya gösterilen posta adresidir;
    // parçalamadan, düzenlenebilir Açık Adres alanına güvenli fallback olur.
    const line1 = formattedAddress?.trim()
        || streetAddress
        || routeAddress
        || premiseAddress
        || undefined

    return {
        countryCode: countryCode || undefined,
        countryName: country?.longText?.trim() || undefined,
        stateName: longText(components, "administrative_area_level_1"),
        // Türkiye veri setinde GeoCity ilçe düzeyini temsil eder. Google bu
        // düzeyi çoğunlukla administrative_area_level_2 olarak döndürür.
        cityName: countryCode === "TR"
            ? longText(
                components,
                "administrative_area_level_2",
                "locality",
                "postal_town",
            )
            : longText(
                components,
                "locality",
                "postal_town",
                "administrative_area_level_2",
            ),
        district: longText(
            components,
            "neighborhood",
            "administrative_area_level_3",
            "sublocality_level_2",
            "sublocality_level_1",
            "sublocality",
        ),
        line1,
        postalCode: postalCode
            ? `${postalCode}${postalCodeSuffix ? `-${postalCodeSuffix}` : ""}`
            : undefined,
    }
}

export function normalizeGeoName(value: string) {
    return value
        .toLocaleLowerCase("tr-TR")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\b(ili|ilcesi|ilçe|province|district|governorate|region)\b/g, " ")
        .replace(/[^a-z0-9çğıöşü]+/g, " ")
        .trim()
        .replace(/\s+/g, " ")
}

export function matchGeoOption<T extends GeoOption>(options: T[], name?: string) {
    if (!name?.trim()) return undefined
    const normalizedName = normalizeGeoName(name)
    return options.find((option) => normalizeGeoName(option.name) === normalizedName)
}

export function matchGeoCountry(
    countries: GeoCountryOption[],
    address: Pick<GooglePlaceAddressDraft, "countryCode" | "countryName">,
) {
    const countryCode = address.countryCode?.trim().toUpperCase()
    return countries.find((country) => countryCode && country.iso2.toUpperCase() === countryCode)
        ?? matchGeoOption(countries, address.countryName)
}
