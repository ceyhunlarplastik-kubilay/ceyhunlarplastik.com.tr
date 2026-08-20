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
}

export type CustomerMapResponse = {
    statusCode: number
    payload: {
        data: CustomerMapPoint[]
    }
}
