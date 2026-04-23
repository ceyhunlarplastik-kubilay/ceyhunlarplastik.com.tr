export type CreateCustomerPayload = {
    companyName?: string
    fullName: string
    phone: string
    email: string
    note?: string
    sectorValueId?: string
    productionGroupValueId?: string
    usageAreaValueIds?: string[]
}

export type CreateCustomerResponse = {
    statusCode: number
    payload: {
        customer: {
            id: string
            fullName: string
            email: string
            phone: string
        }
    }
}
