export type AdminUser = {
    id: string
    email: string
    identifier: string
    groups: string[]
    supplierId?: string | null
    customerId?: string | null
    supplier?: {
        id: string
        name: string
    } | null
    customer?: {
        id: string
        fullName: string
        companyName?: string | null
        status: "LEAD" | "CUSTOMER"
    } | null
    assignedSalesCustomers?: Array<{
        id: string
        fullName: string
        companyName?: string | null
        status: "LEAD" | "CUSTOMER"
    }>
    assignedPurchasingSuppliers?: Array<{
        id: string
        name: string
    }>
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
