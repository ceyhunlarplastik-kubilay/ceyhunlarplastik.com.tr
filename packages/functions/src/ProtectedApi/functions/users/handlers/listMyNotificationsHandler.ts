import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { normalizeListQuery } from "@/core/helpers/pagination/normalizeListQuery"
import type {
    IListMyNotificationsEvent,
    IUserNotificationDependencies,
} from "@/functions/ProtectedApi/types/users"

export const listMyNotificationsHandler =
    ({ userNotificationRepository }: IUserNotificationDependencies) =>
        async (event: IListMyNotificationsEvent) => {
            const user = event.user
            if (!user) throw createError.Unauthorized("User context missing")

            const { page, limit, sort, order } = normalizeListQuery(event.queryStringParameters, {
                allowedSortFields: ["createdAt"],
                defaultSort: "createdAt",
            })

            const result = await userNotificationRepository.listNotifications(user.id, {
                page,
                limit,
                sort,
                order,
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: result,
            })
        }
