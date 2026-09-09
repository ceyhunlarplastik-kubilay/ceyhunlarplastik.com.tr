export type LocationSource = "MANUAL_PIN" | "GEOCODED" | "IMPORTED" | "CUSTOMER_SUBMITTED"
export type LocationAccuracy = "EXACT" | "STREET" | "DISTRICT" | "CITY" | "UNKNOWN"

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
    /** "google_places" ise harita popup'ında native Google işletme kartı gösterilir. */
    geocodingProvider?: string | null
    geocodingPlaceId?: string | null
}

export type CustomerMapResponse = {
    statusCode: number
    payload: {
        data: CustomerMapPoint[]
    }
}

export type CustomerMapCustomerAddress = {
    addressId: string
    addressLabel: string
    addressSummary: string
    latitude: number
    longitude: number
    isPrimary: boolean
    isShipping: boolean
    geocodingProvider?: string | null
    geocodingPlaceId?: string | null
}

/** Aynı `customerId`'ye ait `CustomerMapPoint` satırları tek satırda birleşir. */
export type CustomerMapCustomerGroup = {
    customerId: string
    companyName?: string | null
    fullName: string
    email: string
    phone: string
    status: "LEAD" | "CUSTOMER"
    assignedSalesUserId?: string | null
    addresses: CustomerMapCustomerAddress[]
}
