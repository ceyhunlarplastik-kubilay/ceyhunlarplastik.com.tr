import { safeNumber } from "@/core/helpers/utils/number"

interface NormalizeOptions<T extends readonly string[]> {
    allowedSortFields: T
    defaultSort: T[number]
    maxLimit?: number
    defaultLimit?: number
}

export function normalizeListQuery<
    T extends readonly string[]
>(
    query: Record<string, any> = {},
    options: NormalizeOptions<T>
) {
    const {
        allowedSortFields,
        defaultSort,
        maxLimit = 100,
        defaultLimit = 20,
    } = options

    const parsedPage = safeNumber(query.page)
    const parsedLimit = safeNumber(query.limit)

    const page =
        parsedPage && parsedPage > 0
            ? parsedPage
            : 1

    const limit =
        parsedLimit && parsedLimit > 0
            ? Math.min(parsedLimit, maxLimit)
            : defaultLimit

    const search = query.search?.trim()

    const sort: T[number] =
        allowedSortFields.includes(query.sort)
            ? query.sort
            : defaultSort

    const order: "asc" | "desc" =
        query.order === "desc" ? "desc" : "asc"

    return {
        page,
        limit,
        search,
        sort,
        order,
    }
}
