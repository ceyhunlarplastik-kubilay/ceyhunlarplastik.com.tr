import { userNotificationRepository } from "@/core/helpers/prisma/userNotifications/repository"
import { buildUserAccessChangedMessage } from "@/core/helpers/userAccess/messaging"
import type { UserAccessUpdateEvent } from "./types"

export async function handler(event: UserAccessUpdateEvent) {
    const detail = event.detail
    const notificationRepository = userNotificationRepository()
    const notification = buildUserAccessChangedMessage({
        nextGroup: detail.nextGroups[0] ?? "user",
        nextAccessStatus: detail.nextAccessStatus,
        reason: detail.reason,
    })

    await notificationRepository.createNotification({
        userId: detail.userId,
        type:
            detail.previousAccessStatus !== detail.nextAccessStatus
                ? "ACCESS_STATUS_CHANGED"
                : "ROLE_CHANGED",
        title: notification.title,
        message: notification.message,
        data: {
            previousGroups: detail.previousGroups,
            nextGroups: detail.nextGroups,
            previousAccessStatus: detail.previousAccessStatus,
            nextAccessStatus: detail.nextAccessStatus,
            changedAt: detail.changedAt,
            changedByEmail: detail.changedByEmail,
        },
    })
}
