import { lambdaHandler } from "@/core/middy"
import { orderRepository } from "@/core/helpers/prisma/orders/repository"
import { listAdminOrdersHandler } from "@/functions/AdminApi/functions/orders/handlers"
import type { IListAdminOrdersEvent } from "@/functions/AdminApi/types/orders"
import {
    listOrdersQueryValidator,
    listOrdersResponseValidator,
} from "@/functions/AdminApi/validators/orders"

const deps = {
    orderRepository: orderRepository(),
}

export const listOrders = lambdaHandler(
    async (event) => listAdminOrdersHandler(deps)(event as IListAdminOrdersEvent),
    {
        auth: { requiredPermissionGroups: ["admin", "owner"] },
        requestValidator: listOrdersQueryValidator,
        responseValidator: listOrdersResponseValidator,
    },
)
