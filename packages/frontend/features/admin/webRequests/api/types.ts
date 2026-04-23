export type AdminWebRequestItem = {
    productId: string
    productSlug?: string
    productName?: string
    productCode?: string
    variantKey: string
    variantId?: string
    variantFullCode?: string | null
    quantity: number
}

export type AdminWebRequestItemResolved = AdminWebRequestItem & {
    resolvedProductName?: string
    resolvedProductCode?: string
    resolvedVariantCode?: string
}

export type AdminWebRequest = {
    id: string
    name: string
    email: string
    phone?: string | null
    message?: string | null
    items: AdminWebRequestItem[]
    status: "NEW" | "CONTACTED" | "IN_PROGRESS" | "CLOSED" | string
    createdAt: string
    updatedAt: string
}

export type UpdateWebRequestStatusResponse = {
    statusCode: number
    payload: {
        request: AdminWebRequest
    }
}

export type WebRequestListResponse = {
    statusCode: number
    payload: {
        data: AdminWebRequest[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}
