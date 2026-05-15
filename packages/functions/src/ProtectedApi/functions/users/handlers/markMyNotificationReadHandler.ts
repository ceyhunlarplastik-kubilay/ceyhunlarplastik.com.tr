import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import type {
    IMarkMyNotificationReadEvent,
    IUserNotificationDependencies,
} from "@/functions/ProtectedApi/types/users"

export const markMyNotificationReadHandler =
    ({ userNotificationRepository }: IUserNotificationDependencies) =>
        async (event: IMarkMyNotificationReadEvent) => {
            const user = event.user
            if (!user) throw createError.Unauthorized("User context missing")

            const notification = await userNotificationRepository.markAsRead(
                user.id,
                event.pathParameters.id,
            )

            if (!notification) {
                throw createError.NotFound("Notification not found")
            }

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    notification,
                },
            })
        }
