import { lambdaHandler } from "@/core/middy"
import { orderRepository } from "@/core/helpers/prisma/orders/repository"
import {
    listPortalOrdersHandler,
    listSalesOrdersHandler,
} from "@/functions/ProtectedApi/functions/orders/handlers"
import type {
    IListPortalOrdersEvent,
    IListSalesOrdersEvent,
} from "@/functions/ProtectedApi/types/orders"
import {
    listOrdersQueryValidator,
    listOrdersResponseValidator,
} from "@/functions/AdminApi/validators/orders"

const deps = {
    orderRepository: orderRepository(),
}

export const listPortalOrders = lambdaHandler(
    async (event) => listPortalOrdersHandler(deps)(event as IListPortalOrdersEvent),
    {
        auth: { requiredPermissionGroups: ["customer", "admin", "owner"] },
        requestValidator: listOrdersQueryValidator,
        responseValidator: listOrdersResponseValidator,
    },
)

export const listSalesOrders = lambdaHandler(
    async (event) => listSalesOrdersHandler(deps)(event as IListSalesOrdersEvent),
    {
        auth: { requiredPermissionGroups: ["sales", "sales_director", "admin", "owner"] },
        requestValidator: listOrdersQueryValidator,
        responseValidator: listOrdersResponseValidator,
    },
)
