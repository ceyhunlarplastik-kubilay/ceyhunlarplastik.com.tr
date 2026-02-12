import { IPaginationMeta } from "./types"

export interface IPaginatedResult<T> {
    data: T[]
    meta: IPaginationMeta
}

export function buildPaginationResponse<T>(
    data: T[],
    meta: IPaginationMeta,
): IPaginatedResult<T> {
    return {
        data,
        meta,
    }
}
