import type { CustomerAddress } from "@/features/admin/customers/api/types"
import type { ApiEnvelope } from "@/lib/http/types"

export type LeadCustomerAttributeValue = {
    id: string
    name: string
    slug: string
    parentValueId: string | null
}

export type LeadCustomer = {
    id: string
    companyName: string | null
    websiteUrl: string | null
    fullName: string | null
    phone: string
    email: string
    note: string | null
    sectorValue: LeadCustomerAttributeValue | null
    productionGroupValue: LeadCustomerAttributeValue | null
    usageAreaValues: LeadCustomerAttributeValue[]
    createdAt: string
    updatedAt: string
}

export type LeadCustomerMatchedProduct = {
    id: string
    code: string
    name: string
    slug: string
    categoryName: string | null
    primaryImageUrl: string | null
    matchedLabels: string[]
}

export type LeadCustomerDetail = LeadCustomer & {
    matchedProductCount: number
    matchedProducts: LeadCustomerMatchedProduct[]
    /** Paylaşılan adres tipi: `CustomerAddressFormDialog` bunu doğrudan okur. */
    addresses: CustomerAddress[]
}

export type ListLeadCustomersParams = {
    page?: number
    limit?: number
    search?: string
    sectorValueId?: string
    usageAreaValueId?: string
}

export type ListLeadCustomersPayload = {
    data: LeadCustomer[]
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export type ListLeadCustomersResponse = ApiEnvelope<ListLeadCustomersPayload>
export type LeadCustomerDetailResponse = ApiEnvelope<{ customer: LeadCustomerDetail }>

/** Ticari alanlar bilinçli olarak YOK — bu yüzey onları hiç taşımaz. */
export type LeadCustomerProfileInput = {
    companyName: string
    /** Ham metin gönderilir ("acme.com"); sunucu kanonik biçime indirir. */
    websiteUrl?: string | null
    fullName: string | null
    phone: string
    email?: string | null
    note?: string | null
    sectorValueId?: string | null
    productionGroupValueId?: string | null
    usageAreaValueIds?: string[]
}
