export type ProductAttributeValue = {
    id: string
    name: string
    slug: string
    displayOrder?: number
}

export type ProductAttribute = {
    id: string
    code: string
    name: string
    displayOrder: number
    isActive: boolean
    createdAt: string
    updatedAt: string

    // optional çünkü bazı endpointler values dönmeyebilir
    values?: ProductAttributeValue[]
}
