import type { IPrismaOrderRepository } from "@/core/helpers/prisma/orders/repository"
import type { IAPIGatewayProxyEventWithUserGeneric } from "@/core/helpers/utils/api/types"
import type { OrderStatus } from "@/prisma/generated/prisma/client"

export interface IAdminOrderDependencies {
    orderRepository: IPrismaOrderRepository
}

export type IListAdminOrdersEvent = IAPIGatewayProxyEventWithUserGeneric<
    {},
    {},
    {
        page?: string
        limit?: string
        search?: string
        sort?: string
        order?: "asc" | "desc"
        status?: OrderStatus
    }
>
