export const ADMIN_LIST_PAGE_SIZE_OPTIONS = [10, 20, 50] as const
export const DEFAULT_ADMIN_LIST_PAGE_SIZE = 20

export function normalizeAdminPageSize(limit: number | null | undefined) {
    return ADMIN_LIST_PAGE_SIZE_OPTIONS.includes(
        limit as (typeof ADMIN_LIST_PAGE_SIZE_OPTIONS)[number]
    )
        ? limit!
        : DEFAULT_ADMIN_LIST_PAGE_SIZE
}

export const ADMIN_LIST_REFRESH_INTERVAL_SECONDS = [0, 5, 10, 15, 30, 60] as const
export const DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS = 0

export function normalizeAdminRefreshInterval(seconds: number | null | undefined) {
    return ADMIN_LIST_REFRESH_INTERVAL_SECONDS.includes(
        seconds as (typeof ADMIN_LIST_REFRESH_INTERVAL_SECONDS)[number]
    )
        ? seconds!
        : DEFAULT_ADMIN_LIST_REFRESH_INTERVAL_SECONDS
}
