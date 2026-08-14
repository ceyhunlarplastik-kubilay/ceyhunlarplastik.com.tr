import type { UserSummary } from "@/features/admin/customers/api/types"
import type { DecimalLike } from "@/lib/utils/decimal"

export type ProductVariantCampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED"

/**
 * Prisma `Decimal` alanları JSON'da `{s,e,d}` objesi olarak serialize olabiliyor;
 * paylaşılan `DecimalLike` bu üç biçimi de kapsıyor, okuma
 * `parseDiscountPercent` üzerinden yapılır.
 */
export type { DecimalLike }

export type CampaignVariantSummary = {
    id: string
    name: string
    fullCode: string
    versionCode?: string
    color?: { id: string; name: string; hex?: string | null } | null
    materials?: Array<{ id: string; name: string }>
    measurements?: Array<{
        id: string
        value?: number | string | null
        label?: string | null
        measurementType: {
            id: string
            code: string
            name: string
            baseUnit?: string | null
            displayOrder?: number | null
        }
    }>
    product?: {
        id: string
        name: string
        code: string
        slug: string
        category?: { id: string; name: string } | null
        assets?: Array<{ id: string; key: string; url?: string; type?: string; role?: string }>
    } | null
    assets?: Array<{ id: string; key: string; url?: string; type?: string; role?: string }>
}

export type ProductVariantCampaignItem = {
    id: string
    campaignId: string
    productVariantId: string
    discountPercent?: DecimalLike
    displayOrder: number
    productVariant?: CampaignVariantSummary
}

export type ProductVariantCampaign = {
    id: string
    title: string
    description?: string | null
    discountPercent: DecimalLike
    validFrom?: string | null
    validUntil?: string | null
    status: ProductVariantCampaignStatus
    createdByUserId: string
    createdByUser?: UserSummary | null
    items?: ProductVariantCampaignItem[]
    createdAt: string
    updatedAt: string
}

export type ProductVariantCampaignListPayload = {
    data: ProductVariantCampaign[]
    meta: { page: number; limit: number; total: number; totalPages: number }
}

export type CampaignItemInput = {
    productVariantId: string
    discountPercent?: number | null
}

export type CampaignInput = {
    title: string
    description?: string | null
    discountPercent: number
    validFrom?: string | null
    validUntil?: string | null
    status?: ProductVariantCampaignStatus
    items: CampaignItemInput[]
}
