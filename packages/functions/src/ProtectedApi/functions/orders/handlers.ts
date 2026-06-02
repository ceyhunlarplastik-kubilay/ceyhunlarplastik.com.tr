import createError from "http-errors"

import { mapOrderForApi } from "@/core/helpers/orders/mapOrderForApi"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    IListPortalOrdersEvent,
    IListSalesOrdersEvent,
    IProtectedOrderDependencies,
} from "@/functions/ProtectedApi/types/orders"

export const listPortalOrdersHandler =
    ({ orderRepository }: IProtectedOrderDependencies) =>
        async (event: IListPortalOrdersEvent) => {
            const user = event.user
            if (!user?.customerId) {
                throw new createError.Forbidden("Customer portal context missing")
            }

            const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters ?? {}, {
                allowedSortFields: ["createdAt", "updatedAt", "orderNumber", "status", "requestedDeliveryDate"],
                defaultSort: "createdAt",
            })

            const result = await orderRepository.listOrders({
                page,
                limit,
                search,
                sort,
                order,
                status: event.queryStringParameters?.status,
                customerId: user.customerId,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data.map(mapOrderForApi),
                    meta: result.meta,
                },
            })
        }

export const listSalesOrdersHandler =
    ({ orderRepository }: IProtectedOrderDependencies) =>
        async (event: IListSalesOrdersEvent) => {
            const user = event.user
            if (!user) {
                throw new createError.Forbidden("User context missing")
            }

            const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters ?? {}, {
                allowedSortFields: ["createdAt", "updatedAt", "orderNumber", "status", "requestedDeliveryDate"],
                defaultSort: "createdAt",
            })

            const result = await orderRepository.listOrders({
                page,
                limit,
                search,
                sort,
                order,
                status: event.queryStringParameters?.status,
                ...(user.isSales && !user.isSalesDirector && !user.isAdmin && !user.isOwner
                    ? { customerAssignedSalesUserId: user.id }
                    : {}),
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data.map(mapOrderForApi),
                    meta: result.meta,
                },
            })
        }
