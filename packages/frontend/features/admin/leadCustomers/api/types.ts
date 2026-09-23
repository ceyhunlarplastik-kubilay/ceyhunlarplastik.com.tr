import type { CustomerAddress } from "@/features/admin/customers/api/types"
import type { ApiEnvelope } from "@/lib/http/types"
import type { CustomerProfileMatchedProduct } from "@/features/crm/types"
import type { CustomerPhone } from "@/features/customerPhones/types"
import type { CustomerAdditionalPhoneInput } from "@core/helpers/crm/customerPhones"

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
    /** Birincil numara; ek hatlar `additionalPhones`'ta. */
    phone: string
    additionalPhones: CustomerPhone[]
    email: string
    note: string | null
    sectorValue: LeadCustomerAttributeValue | null
    productionGroupValue: LeadCustomerAttributeValue | null
    usageAreaValues: LeadCustomerAttributeValue[]
    createdAt: string
    updatedAt: string
}

/** Ortak CRM tipi — potansiyel/cari ayrımı yok. */
export type LeadCustomerMatchedProduct = CustomerProfileMatchedProduct

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
    /** Adres filtresi — normalize geo FK'ları (ülke → il → ilçe). */
    countryId?: number
    stateId?: number
    cityId?: number
}

export type DeleteLeadCustomersResult = {
    deletedIds: string[]
    /** Silinemeyenler — adı ve sebebiyle ("2 sipariş", "cari müşteriye dönüştürülmüş"). */
    blocked: Array<{ id: string; name: string; reason: string }>
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
    /** Verilirse TAM DEĞİŞİM; verilmezse sunucu ek numaralara dokunmaz. */
    additionalPhones?: CustomerAdditionalPhoneInput[]
    email?: string | null
    note?: string | null
    sectorValueId?: string | null
    productionGroupValueId?: string | null
    usageAreaValueIds?: string[]
}
