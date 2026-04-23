import createError from "http-errors"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IListWebRequestsEvent, IWebRequestDependencies } from "@/functions/AdminApi/types/webRequests"

const ALLOWED_SORT_FIELDS = ["name", "email", "status", "createdAt"] as const
const ALLOWED_STATUSES = new Set(["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED"])

export const listWebRequestsHandler = ({ webRequestRepository }: IWebRequestDependencies) => {
    return async (event: IListWebRequestsEvent) => {
        const { page, limit, search, sort, order } = normalizeListQuery(event.queryStringParameters, {
            allowedSortFields: ALLOWED_SORT_FIELDS,
            defaultSort: "createdAt",
        })

        try {
            const status = event.queryStringParameters?.status
            const normalizedStatus =
                status && ALLOWED_STATUSES.has(status) ? status : undefined

            const result = await webRequestRepository.listWebRequests({
                page,
                limit,
                search,
                sort,
                order,
                status: normalizedStatus,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    data: result.data,
                    meta: result.meta,
                },
            })
        } catch (error) {
            console.error(error)
            throw new createError.InternalServerError("Failed to list web requests")
        }
    }
}
