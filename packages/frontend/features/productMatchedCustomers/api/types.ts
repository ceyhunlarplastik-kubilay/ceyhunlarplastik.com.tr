export type ProductMatchedCustomerStatus = "LEAD" | "CUSTOMER"

export type ProductProfileReachLabel = {
    id: string
    name: string
}

export type ProductMatchedCustomer = {
    id: string
    companyName: string | null
    fullName: string | null
    email: string
    phone: string
    status: ProductMatchedCustomerStatus
    createdAt: string
    sectorName: string | null
    productionGroupName: string | null
    assignedSalesUserName: string | null
    locationSummary: string | null
    /**
     * Harita görünümü için tam adres + koordinat. Koordinat Google Places'ten
     * gelip önbellek süresi dolduysa null döner (sağlayıcı şartı).
     */
    address: {
        id: string
        label: string
        summary: string
        latitude: number | null
        longitude: number | null
        isPrimary: boolean
        isShipping: boolean
    } | null
    /** "Neden eşleşti?" rozetleri — müşteri profilinin ürünle kesişen değerleri. */
    matchedLabels: string[]
}

export type ProductMatchedCustomersPayload = {
    data: ProductMatchedCustomer[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    /** Sekme sayaçları: durum filtresi hariç diğer filtreler uygulanmış hâl. */
    counts: {
        all: number
        lead: number
        customer: number
    }
    /** Ürünün erişim kümesi — sonuç boşsa "neden boş" sorusunu cevaplar. */
    reach: {
        sectors: ProductProfileReachLabel[]
        productionGroups: ProductProfileReachLabel[]
        usageAreas: ProductProfileReachLabel[]
    }
}

export type ProductMatchedCustomersResponse = {
    statusCode: number
    payload: ProductMatchedCustomersPayload
}
