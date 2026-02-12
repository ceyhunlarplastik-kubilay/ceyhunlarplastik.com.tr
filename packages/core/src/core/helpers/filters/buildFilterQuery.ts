export function buildFilterQuery<T>(
    query: Record<string, any>,
    allowedFields: (keyof T)[]
) {
    const where: Record<string, any> = {}

    for (const key in query) {
        if (!allowedFields.includes(key as keyof T)) continue
        const value = query[key]
        if (value === undefined) continue
        where[key] = value
    }

    return where
}
