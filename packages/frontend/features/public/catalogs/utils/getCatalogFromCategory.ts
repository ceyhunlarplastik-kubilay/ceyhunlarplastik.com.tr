export function getCatalogFromCategory(category: any) {
    return category.assets?.find(
        (a: any) => a.type === "PDF" && a.role === "DOCUMENT"
    )
}
