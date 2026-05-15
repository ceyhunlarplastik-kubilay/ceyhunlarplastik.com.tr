import { safeNumber } from "@/core/helpers/utils/number";
export function normalizeListQuery(query = {}, options) {
    const { allowedSortFields, defaultSort, maxLimit = 100, defaultLimit = 20, } = options;
    const parsedPage = safeNumber(query.page);
    const parsedLimit = safeNumber(query.limit);
    const page = parsedPage && parsedPage > 0
        ? parsedPage
        : 1;
    const limit = parsedLimit && parsedLimit > 0
        ? Math.min(parsedLimit, maxLimit)
        : defaultLimit;
    const search = query.search?.trim();
    const sort = allowedSortFields.includes(query.sort)
        ? query.sort
        : defaultSort;
    const order = query.order === "desc" ? "desc" : "asc";
    return {
        page,
        limit,
        search,
        sort,
        order,
    };
}
