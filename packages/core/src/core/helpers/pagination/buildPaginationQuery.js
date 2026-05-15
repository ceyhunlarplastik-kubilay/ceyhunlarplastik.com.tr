export function buildPaginationQuery(query, options = {}) {
    const { searchableFields = [], defaultSort, maxLimit = 100, } = options;
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0
        ? Math.min(query.limit, maxLimit)
        : 20;
    const skip = (page - 1) * limit;
    const where = {};
    // 🔍 Search builder
    if (query.search && searchableFields.length > 0) {
        where.OR = searchableFields.map((field) => ({
            [field]: {
                contains: query.search,
                mode: "insensitive",
            },
        }));
    }
    // 🔃 Sorting
    const sortField = query.sort || defaultSort;
    const order = query.order === "desc" ? "desc" : "asc";
    const orderBy = sortField
        ? {
            [sortField]: order,
        }
        : undefined;
    return {
        where,
        orderBy,
        skip,
        take: limit,
        page,
        limit,
    };
}
