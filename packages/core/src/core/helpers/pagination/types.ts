export interface IPaginationQuery {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
}

export interface IPaginationMeta {
    page: number
    limit: number
    total: number
    totalPages: number
}
