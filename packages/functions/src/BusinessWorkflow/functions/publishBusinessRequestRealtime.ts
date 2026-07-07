import { IoTDataPlaneClient, PublishCommand } from "@aws-sdk/client-iot-data-plane"
import { Resource } from "sst"
import type { BusinessWorkflowEvent } from "./types"
import {
    buildBusinessWorkflowNotificationCopy,
    resolveBusinessWorkflowNotificationTargets,
} from "./notificationFanout"

const data = new IoTDataPlaneClient({
    endpoint: Resource.UserAccessRealtime.endpoint,
})

export async function handler(event: BusinessWorkflowEvent) {
    const topicPrefix = process.env.BUSINESS_WORKFLOW_REALTIME_TOPIC_PREFIX
    if (!topicPrefix) return

    const copy = buildBusinessWorkflowNotificationCopy(event)
    if (!copy) return

    const targets = await resolveBusinessWorkflowNotificationTargets(event)
    if (targets.length === 0) return

    const detail = event.detail
    const payload = {
        eventType: event["detail-type"],
        notificationType: copy.type,
        title: copy.title,
        message: copy.message,
        requestId: detail.requestId,
        requestType: detail.type,
        domain: detail.domain,
        occurredAt: detail.occurredAt ?? new Date().toISOString(),
    }

    await Promise.all(targets.map((target) =>
        data.send(new PublishCommand({
            topic: `${topicPrefix}/${target.id}`,
            qos: 1,
            payload: Buffer.from(JSON.stringify(payload)),
        }))
    ))
}
