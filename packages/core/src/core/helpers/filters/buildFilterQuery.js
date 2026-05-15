export function buildFilterQuery(query, allowedFields) {
    const where = {};
    for (const key in query) {
        if (!allowedFields.includes(key))
            continue;
        const value = query[key];
        if (value === undefined)
            continue;
        where[key] = value;
    }
    return where;
}
