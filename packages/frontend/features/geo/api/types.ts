export type GeoCountry = {
    id: number
    name: string
    iso2: string
    iso3?: string | null
}

export type GeoState = {
    id: number
    name: string
    countryId: number
}

export type GeoCity = {
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
