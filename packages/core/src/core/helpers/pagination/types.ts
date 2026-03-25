export interface IPaginationQuery {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    attributeValueIds?: string[]
    attributeFilters?: [string, string][]
}

export interface IPaginationMeta {
    page: number
    limit: number
    total: number
    totalPages: number
}
