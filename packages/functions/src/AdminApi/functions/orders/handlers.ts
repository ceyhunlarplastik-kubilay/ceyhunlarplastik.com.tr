import { mapOrderForApi } from "@/core/helpers/orders/mapOrderForApi"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    IAdminOrderDependencies,
    IListAdminOrdersEvent,
} from "@/functions/AdminApi/types/orders"

export const listAdminOrdersHandler =
    ({ orderRepository }: IAdminOrderDependencies) =>
        async (event: IListAdminOrdersEvent) => {
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
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data.map(mapOrderForApi),
                    meta: result.meta,
                },
            })
        }
