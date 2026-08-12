import type { SupportedLocale } from "@core/i18n/locales"
import type { ApiEnvelope } from "@/lib/http/types"

/** Yalnız DOLU diller taşınır; boş metinler payload'a hiç girmez. */
export type UsageFunctionLocaleMap = Partial<Record<SupportedLocale, string>>

export type IndustrialUsageFunctionProduct = {
    id: string
    code: string
    slug: string
    name: string
    categoryName: string | null
    /** Her sayfanın başlığına o dilin ürün adını yazabilmek için. */
    names: UsageFunctionLocaleMap
}

export type IndustrialUsageFunctionRow = {
    usageId: string
    displayOrder: number
    sectorValueId: string | null
    productionGroupValueId: string | null
    usageAreaValueId: string | null
    usageFunctions: UsageFunctionLocaleMap
}

/** attributeValueId → locale → ad. Satır başına tekrar etmesin diye sözlük. */
export type IndustrialUsageFunctionTaxonomy = Record<string, UsageFunctionLocaleMap>

export type IndustrialUsageFunctionsPayload = {
    product: IndustrialUsageFunctionProduct
    taxonomy: IndustrialUsageFunctionTaxonomy
    rows: IndustrialUsageFunctionRow[]
}

export type IndustrialUsageFunctionsResponse = ApiEnvelope<IndustrialUsageFunctionsPayload>

export type ApplyIndustrialUsageFunctionsBody = {
    rows: Array<{
        usageId: string
        usageFunctions: UsageFunctionLocaleMap
    }>
}

export type IndustrialUsageFunctionLocaleStats = {
    created: number
    updated: number
    unchanged: number
}

export type ApplyIndustrialUsageFunctionsPayload = {
    touchedRows: number
    created: number
    updated: number
    unchanged: number
    byLocale: Record<string, IndustrialUsageFunctionLocaleStats>
}

export type ApplyIndustrialUsageFunctionsResponse =
    ApiEnvelope<ApplyIndustrialUsageFunctionsPayload>
