export type AdminUser = {
    id: string
    email: string
    identifier: string
    groups: string[]
    supplierId?: string | null
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export type UserListResponse = {
    statusCode: number
    payload: {
        data: AdminUser[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export type UserResponse = {
    statusCode: number
    payload: {
        user: AdminUser
    }
}
