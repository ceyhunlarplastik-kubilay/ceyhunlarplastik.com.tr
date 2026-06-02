import type { ORDER_STATUS_VALUES } from "@/features/orders/config"

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number]
export type OrderListScope = "portal" | "sales" | "admin"

export type OrderUserSummary = {
    id: string
    email: string
    identifier: string
    firstName?: string | null
    lastName?: string | null
    groups?: string[]
    imageUrl?: string | null
}

export type OrderCustomerSummary = {
    id: string
    companyName?: string | null
    fullName: string
    email: string
    phone: string
    assignedSalesUserId?: string | null
    assignedSalesUser?: OrderUserSummary | null
}

export type OrderAddressSummary = {
    id: string
    customerId: string
    label: string
    contactName?: string | null
    phone?: string | null
    email?: string | null
    country: string
    city: string
    district?: string | null
    line1: string
    line2?: string | null
    postalCode?: string | null
    isPrimary: boolean
    isBilling: boolean
    isShipping: boolean
    displayOrder: number
    createdAt: string
    updatedAt: string
}

export type OrderItem = {
    id: string
    orderId: string
    productVariantId?: string | null
    quantity: number
    listUnitPrice?: number | null
    customerUnitPrice?: number | null
    listLineTotal?: number | null
    customerLineTotal?: number | null
    currency: string
    note?: string | null
    data?: Record<string, unknown> | null
    displayOrder: number
    createdAt: string
    updatedAt: string
    productVariant?: {
        id: string
        fullCode: string
        versionCode: string
        name: string
        product?: {
            id: string
            code: string
            name: string
            slug: string
            assets?: Array<{
                id: string
                url: string
            }>
        } | null
    } | null
}

export type Order = {
    id: string
    orderNumber: string
    status: OrderStatus
    title: string
    customerId: string
    requestedByUserId?: string | null
    sourceRequestId?: string | null
    shippingAddressId?: string | null
    shippingAddressLabel?: string | null
    shippingAddressSnapshot?: Record<string, unknown> | null
    referenceCode?: string | null
    currency: string
    totalQuantity: number
    discountPercent?: number | null
    listSubtotal?: number | null
    customerSubtotal?: number | null
    requestedDeliveryDate?: string | null
    paymentTermDays?: number | null
    paymentTermNote?: string | null
    commercialNote?: string | null
    negotiationNote?: string | null
    approvedFromRequestAt?: string | null
    createdAt: string
    updatedAt: string
    customer: OrderCustomerSummary
    requestedByUser?: OrderUserSummary | null
    shippingAddress?: OrderAddressSummary | null
    sourceRequest?: {
        id: string
        type: string
        status: string
        createdAt: string
        updatedAt: string
    } | null
    items?: OrderItem[]
}

export type ListOrdersParams = {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: "asc" | "desc"
    status?: OrderStatus
}

export type OrderListResponse = {
    statusCode: number
    payload: {
        data: Order[]
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}
