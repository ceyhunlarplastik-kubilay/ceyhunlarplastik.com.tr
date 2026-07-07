import { userNotificationRepository } from "@/core/helpers/prisma/userNotifications/repository"
import type { BusinessWorkflowEvent } from "./types"
import {
    buildBusinessWorkflowNotificationCopy,
    resolveBusinessWorkflowNotificationTargets,
} from "./notificationFanout"

export async function handler(event: BusinessWorkflowEvent) {
    const copy = buildBusinessWorkflowNotificationCopy(event)
    if (!copy) return

    const targets = await resolveBusinessWorkflowNotificationTargets(event)
    if (targets.length === 0) return

    const repository = userNotificationRepository()

    await Promise.all(targets.map((target) =>
        repository.createNotification({
            userId: target.id,
            type: copy.type,
            title: copy.title,
            message: copy.message,
            data: event.detail,
        })
    ))
}
