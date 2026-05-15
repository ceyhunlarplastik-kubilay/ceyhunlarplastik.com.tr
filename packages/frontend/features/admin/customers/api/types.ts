import type { Product } from "@/features/public/products/types"

export type UserSummary = {
    id: string
    email: string
    identifier: string
    groups?: string[]
}

export type CustomerAttributeValue = {
    id: string
    name: string
    slug: string
    attributeId: string
    parentValueId?: string | null
}

export type CustomerStatus = "LEAD" | "CUSTOMER"
export type CustomerVisitStatus = "PLANNED" | "COMPLETED" | "CANCELED"

export type CustomerFeaturedProduct = {
    id: string
    customerId: string
    productId: string
    displayOrder: number
    createdByUserId: string
    createdAt: string
    updatedAt: string
    createdByUser?: UserSummary
    product: Product
}

export type CustomerAssignedProduct = CustomerFeaturedProduct

export type CustomerAddress = {
    id: string
    customerId: string
    label: string
    contactName?: string | null
    phone?: string | null
    email?: string | null
    country: string
    city: string
    district?: string | null
    line1: string
    line2?: string | null
    postalCode?: string | null
    taxOffice?: string | null
    isPrimary: boolean
    isBilling: boolean
    isShipping: boolean
    note?: string | null
    displayOrder: number
    createdAt: string
    updatedAt: string
}

export type CustomerVisit = {
    id: string
    customerId: string
    ownerUserId: string
    scheduledAt: string
    status: CustomerVisitStatus
    title: string
    note?: string | null
    completedAt?: string | null
    createdByUserId: string
    createdAt: string
    updatedAt: string
    ownerUser?: UserSummary
    createdByUser?: UserSummary
}

export type AdminCustomer = {
    id: string
    companyName?: string | null
    fullName: string
    phone: string
    email: string
    note?: string | null
    status: CustomerStatus
    assignedSalesUserId?: string | null
    convertedAt?: string | null
    convertedByUserId?: string | null
    sectorValueId?: string | null
    productionGroupValueId?: string | null
    createdAt: string
    updatedAt: string
    sectorValue?: CustomerAttributeValue | null
    productionGroupValue?: CustomerAttributeValue | null
    usageAreaValues?: CustomerAttributeValue[]
    assignedSalesUser?: UserSummary | null
    convertedByUser?: UserSummary | null
    featuredProducts?: CustomerFeaturedProduct[]
    assignedProducts?: CustomerAssignedProduct[]
    addresses?: CustomerAddress[]
    visits?: CustomerVisit[]
}

export type CustomerListPayload = {
    data: AdminCustomer[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export type CustomerListResponse = {
    statusCode: number
    payload: CustomerListPayload
}

export type CustomerResponse = {
    statusCode: number
    payload: {
        customer: AdminCustomer
    }
}

export type CustomerFeaturedProductsResponse = {
    statusCode: number
    payload: {
        data: CustomerFeaturedProduct[]
    }
}

export type CustomerVisitsResponse = {
    statusCode: number
    payload: {
        data: CustomerVisit[]
    }
}

export type CustomerAssignedProductsResponse = {
    statusCode: number
    payload: {
        data: CustomerAssignedProduct[]
    }
}

export type CustomerVisitResponse = {
    statusCode: number
    payload: {
        visit: CustomerVisit
    }
}
