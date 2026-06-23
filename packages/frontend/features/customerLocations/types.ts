export type LocationSource = "MANUAL_PIN" | "GEOCODED" | "IMPORTED" | "CUSTOMER_SUBMITTED"
export type LocationAccuracy = "EXACT" | "STREET" | "DISTRICT" | "CITY" | "UNKNOWN"

export type GeocodeAddressParts = {
    countryId?: number | null
    stateId?: number | null
    cityId?: number | null
    country?: string | null
    stateName?: string | null
    city?: string | null
    district?: string | null
    line1?: string | null
    postalCode?: string | null
}

export type GeocodeResult = {
    label: string
    latitude: number
    longitude: number
    provider: "nominatim"
    providerPlaceId?: string | null
    locationAccuracy: LocationAccuracy
    addressParts: GeocodeAddressParts
    raw?: unknown
}

export type ReverseGeocodeResult = GeocodeResult

export type CustomerMapPoint = {
    customerId: string
    companyName?: string | null
    fullName: string
    email: string
    phone: string
    status: "LEAD" | "CUSTOMER"
    assignedSalesUserId?: string | null
    addressId: string
    addressLabel: string
    addressSummary: string
    latitude: number
    longitude: number
    isPrimary: boolean
    isShipping: boolean
}

export type CustomerMapResponse = {
    statusCode: number
    payload: {
        data: CustomerMapPoint[]
    }
}

