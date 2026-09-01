// `latitude`/`longitude` upstream veri kümesinde var ve backend tüm sütunları
// döndürüyor (Decimal -> string). Harita "bölgeye uç" efekti bunları kullanır.
export type GeoLatLng = {
    latitude?: string | number | null
    longitude?: string | number | null
}

export type GeoCountry = GeoLatLng & {
    id: number
    name: string
    iso2: string
    iso3?: string | null
}

export type GeoState = GeoLatLng & {
    id: number
    name: string
    countryId: number
}

export type GeoCity = GeoLatLng & {
    id: number
    name: string
    countryId: number
    stateId?: number | null
}

export type GeoCountriesResponse = {
    statusCode: number
    payload: {
        data: GeoCountry[]
    }
}

export type GeoStatesResponse = {
    statusCode: number
    payload: {
        data: GeoState[]
    }
}

export type GeoCitiesResponse = {
    statusCode: number
    payload: {
        data: GeoCity[]
    }
}
