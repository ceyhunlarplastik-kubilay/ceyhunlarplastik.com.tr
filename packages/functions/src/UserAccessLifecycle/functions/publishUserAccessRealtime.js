import { IoTDataPlaneClient, PublishCommand } from "@aws-sdk/client-iot-data-plane";
import { Resource } from "sst";
import { buildUserAccessChangedMessage } from "@/core/helpers/userAccess/messaging";
const data = new IoTDataPlaneClient({
    endpoint: Resource.UserAccessRealtime.endpoint,
});
export async function handler(event) {
    const detail = event.detail;
    const message = buildUserAccessChangedMessage({
        nextGroup: detail.nextGroups[0] ?? "user",
        nextAccessStatus: detail.nextAccessStatus,
        reason: detail.reason,
    });
    const topicPrefix = process.env.USER_ACCESS_REALTIME_TOPIC_PREFIX;
    if (!topicPrefix)
        return;
    await data.send(new PublishCommand({
        topic: `${topicPrefix}/${detail.cognitoSub}/access`,
        payload: Buffer.from(JSON.stringify({
            type: "user.access.updated",
            title: message.title,
            message: message.message,
            changedAt: detail.changedAt,
            nextGroups: detail.nextGroups,
            nextAccessStatus: detail.nextAccessStatus,
        })),
    }));
}
