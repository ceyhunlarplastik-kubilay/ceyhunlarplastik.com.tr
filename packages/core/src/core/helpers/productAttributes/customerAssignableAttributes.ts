export const SYSTEM_CUSTOMER_ATTRIBUTE_CODES = {
    sector: "sector",
    productionGroup: "production_group",
    usageArea: "usage_area",
} as const

const SYSTEM_CUSTOMER_ATTRIBUTE_CODE_SET = new Set<string>(Object.values(SYSTEM_CUSTOMER_ATTRIBUTE_CODES))

export function isSystemCustomerAssignableAttributeCode(code?: string | null) {
    return Boolean(code && SYSTEM_CUSTOMER_ATTRIBUTE_CODE_SET.has(code))
}

export function getEffectiveCustomerAssignable(attribute: {
    code?: string | null
    isCustomerAssignable?: boolean | null
}) {
    return isSystemCustomerAssignableAttributeCode(attribute.code) || Boolean(attribute.isCustomerAssignable)
}
