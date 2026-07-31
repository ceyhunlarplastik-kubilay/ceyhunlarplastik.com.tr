import type { ApiEnvelope } from "@/lib/http/types";
import type { SupportedLocale } from "@core/i18n/locales"

export type ProductAttributeValue = {
    id: string
    name: string
    slug: string
    locale?: SupportedLocale
    resolvedLocale?: string
    translationMissing?: boolean
    alternateSlugs?: Record<string, string>
    translations?: {
        id: string
        locale: string
        name: string
        slug: string
        createdAt: string
        updatedAt: string
    }[]
    displayOrder?: number
    parentValueId?: string | null
    assets?: {
        id: string
        key: string
        mimeType: string
        type: string
        role: string
        url: string
    }[]
}

export type ProductAttribute = {
    id: string
    code: string
    name: string
    locale?: SupportedLocale
    resolvedLocale?: string
    translationMissing?: boolean
    translations?: {
        id: string
        locale: string
        name: string
        createdAt: string
        updatedAt: string
    }[]
    displayOrder: number
    isActive: boolean
    isCustomerAssignable?: boolean
    createdAt: string
    updatedAt: string

    // optional çünkü bazı endpointler values dönmeyebilir
    values?: ProductAttributeValue[]
}

export type ListAttributesResponse = ApiEnvelope<{
    data: ProductAttribute[]
}>

/**
 * Ana sayfa ürün asistanı + navbar numune-talep dialog'unun ihtiyaç duyduğu slim şekil.
 * Full attribute ağacı (9 code × 1087 value × translations × assets ≈ 1.28MB) tarayıcıya
 * RSC flight ile iniyordu; bu yüzeyler yalnız 3 müşteri-profili code'unu ve value başına
 * id/name/slug/parentValueId + PRIMARY asset url'ini kullanıyor. Slim tip bu farkı tipte de sabitler.
 */
export type ProductAttributeFilterValue = {
    id: string
    name: string
    slug: string
    parentValueId?: string | null
    assets?: {
        id: string
        role: string
        url: string
    }[]
}

export type ProductAttributeFilter = {
    code: string
    values: ProductAttributeFilterValue[]
}
