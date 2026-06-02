import { adminApiClient, protectedApiClient } from "@/lib/http/client"
import type {
    ListOrdersParams,
    OrderListResponse,
    OrderListScope,
} from "@/features/orders/api/types"

const scopePathMap: Record<OrderListScope, string> = {
    portal: "/portal/customer/orders",
    sales: "/sales/orders",
    admin: "/orders",
}

export async function listOrders(scope: OrderListScope, params: ListOrdersParams = {}) {
    const client = scope === "admin" ? adminApiClient : protectedApiClient
    const res = await client.get<OrderListResponse>(scopePathMap[scope], { params })
    return res.data.payload
}
