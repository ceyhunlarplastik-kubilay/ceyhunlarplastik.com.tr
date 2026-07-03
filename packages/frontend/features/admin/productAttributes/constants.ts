export const ATTRIBUTE_CODES = {
    sector: "sector",
    productionGroup: "production_group",
    usageArea: "usage_area",
} as const

export const SYSTEM_CUSTOMER_ATTRIBUTE_CODES = new Set<string>([
    ATTRIBUTE_CODES.sector,
    ATTRIBUTE_CODES.productionGroup,
    ATTRIBUTE_CODES.usageArea,
])

export const VALUE_PAGE_SIZE_OPTIONS = [8, 12, 24, 48] as const

export const ATTRIBUTE_VALUE_IMAGE_MAX_SIZE_BYTES = 3 * 1024 * 1024

export function isSystemCustomerAttributeCode(code?: string | null) {
    return Boolean(code && SYSTEM_CUSTOMER_ATTRIBUTE_CODES.has(code))
}

export function getParentAttributeCode(attributeCode: string): string | null {
    if (attributeCode === ATTRIBUTE_CODES.productionGroup) return ATTRIBUTE_CODES.sector
    if (attributeCode === ATTRIBUTE_CODES.usageArea) return ATTRIBUTE_CODES.productionGroup
    return null
}

export function getAttributeLabel(code: string | null) {
    if (code === ATTRIBUTE_CODES.sector) return "Sektör"
    if (code === ATTRIBUTE_CODES.productionGroup) return "Üretim Grubu"
    if (code === ATTRIBUTE_CODES.usageArea) return "Endüstriyel Kullanım Alanı"
    return "Üst Değer"
}
