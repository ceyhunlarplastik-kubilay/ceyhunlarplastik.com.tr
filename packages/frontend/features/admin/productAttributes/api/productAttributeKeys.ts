export const productAttributeKeys = {
    all: ["product-attributes"] as const,
    detail: (id: string) => [...productAttributeKeys.all, "detail", id] as const,
    values: (attributeId: string) => ["attribute-values", attributeId] as const,
    withValues: () => ["product-attributes-filter"] as const,
}
