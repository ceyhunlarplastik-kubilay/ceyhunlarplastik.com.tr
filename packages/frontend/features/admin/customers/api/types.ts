import type { Product } from "@/features/public/products/types"

export type UserSummary = {
    id: string
    email: string
    identifier: string
    firstName?: string | null
    lastName?: string | null
    groups?: string[]
    phone?: string | null
    imageUrl?: string | null
    customerContactTitle?: string | null
    customerContactDepartment?: string | null
    isPrimaryCustomerContact?: boolean
}

export type CustomerAttributeValue = {
    id: string
    name: string
    slug: string
    attributeId: string
    parentValueId?: string | null
    assets?: Array<{
        id: string
        key: string
        mimeType: string
        type: string
        role: string
        url?: string
    }>
    attribute?: {
        id: string
        code: string
        name: string
    }
}

export type CustomerAttributeValueAssignment = {
    id: string
    customerId: string
    attributeValueId: string
    source: "MANUAL" | "LEGACY_BACKFILL" | "SYSTEM"
    createdAt: string
    updatedAt: string
    attributeValue: CustomerAttributeValue
}

export type CompanyContact = {
    id: string
    department: string
    name: string
    roleLabel?: string | null
    email?: string | null
    phone?: string | null
    whatsappPhone?: string | null
    note?: string | null
    isActive: boolean
    displayOrder: number
    createdAt: string
    updatedAt: string
}

export type CustomerCompanyContactAssignment = {
    id: string
    customerId: string
    companyContactId: string
    isActive: boolean
    displayOrder: number
    note?: string | null
    createdAt: string
    updatedAt: string
    companyContact: CompanyContact
}

export type CustomerStatus = "LEAD" | "CUSTOMER"
export type CustomerVisitStatus = "PLANNED" | "COMPLETED" | "CANCELED"

export type CustomerFeaturedProduct = {
    id: string
    customerId: string
    productId: string
    displayOrder: number
    createdByUserId?: string
    createdAt?: string
    updatedAt?: string
    source?: "MANUAL" | "ATTRIBUTE_MATCH"
    isProfileMatched?: boolean
    matchedAttributeValueIds?: string[]
    matchedAttributeLabels?: string[]
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
    countryId?: number | null
    stateId?: number | null
    cityId?: number | null
    country: string
    city: string
    district?: string | null
    line1: string
    line2?: string | null
    postalCode?: string | null
    taxOffice?: string | null
    taxNumber?: string | null
    isPrimary: boolean
    isBilling: boolean
    isShipping: boolean
    note?: string | null
    displayOrder: number
    createdAt: string
    updatedAt: string
    countryRef?: {
        id: number
        name: string
        iso2: string
    } | null
    stateRef?: {
        id: number
        name: string
    } | null
    cityRef?: {
        id: number
        name: string
    } | null
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
    generalDiscountPercent?: number | null
    defaultPaymentTermDays?: number | null
    creditLimit?: number | null
    paymentTermNote?: string | null
    assignedSalesUserId?: string | null
    convertedAt?: string | null
    convertedByUserId?: string | null
    sectorValueId?: string | null
    productionGroupValueId?: string | null
    createdAt: string
    updatedAt: string
    attributeValueAssignments?: CustomerAttributeValueAssignment[]
    companyContactAssignments?: CustomerCompanyContactAssignment[]
    sectorValue?: CustomerAttributeValue | null
    productionGroupValue?: CustomerAttributeValue | null
    usageAreaValues?: CustomerAttributeValue[]
    assignedSalesUser?: UserSummary | null
    convertedByUser?: UserSummary | null
    portalUsers?: UserSummary[]
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
