export type CustomerAttributeValue = {
    id: string
    name: string
    slug: string
    attributeId: string
    parentValueId?: string | null
}

export type AdminCustomer = {
    id: string
    companyName?: string | null
    fullName: string
    phone: string
    email: string
    note?: string | null
    sectorValueId?: string | null
    productionGroupValueId?: string | null
    createdAt: string
    updatedAt: string
    sectorValue?: CustomerAttributeValue | null
    productionGroupValue?: CustomerAttributeValue | null
    usageAreaValues?: CustomerAttributeValue[]
}

export type CustomerListResponse = {
    statusCode: number
    payload: {
        data: AdminCustomer[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}
