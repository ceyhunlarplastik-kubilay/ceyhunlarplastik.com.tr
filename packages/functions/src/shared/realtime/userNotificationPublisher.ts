import { IoTDataPlaneClient, PublishCommand } from "@aws-sdk/client-iot-data-plane"

import { iotDataEndpointUrl } from "@/functions/shared/realtime/iotDataEndpoint"

/** Kullanıcının bildirim konusuna yayın en çok bu kadar beklenir. */
const PUBLISH_TIMEOUT_MS = 2_000

/**
 * Tarayıcıdaki bildirim zilinin beklediği canlı mesaj (`useRealtimeNotifications` — başlık, metin,
 * olay ve bildirim türü zorunlu). Gelen mesaj toast olur ve zil listesi tazelenir.
 */
export type UserNotificationRealtimePayload = {
    eventType: string
    notificationType: string
    title: string
    message: string
    occurredAt: string
}

/**
 * Kullanıcının bildirim konusuna (`${prefix}/${userId}`) yayıncı üretir. Uç nokta ya da konu öneki
 * yoksa (test, eksik yapılandırma) `null` — çağıran canlı yayını atlar; bildirim yine kalıcıdır.
 */
export function createUserNotificationPublisher(env: { endpoint?: string; topicPrefix?: string }) {
    if (!env.endpoint || !env.topicPrefix) return null
    const client = new IoTDataPlaneClient({ endpoint: iotDataEndpointUrl(env.endpoint) })
    const topicPrefix = env.topicPrefix
    return async (userId: string, payload: UserNotificationRealtimePayload) => {
        await client.send(
            new PublishCommand({ topic: `${topicPrefix}/${userId}`, qos: 1, payload: Buffer.from(JSON.stringify(payload)) }),
            { abortSignal: AbortSignal.timeout(PUBLISH_TIMEOUT_MS) },
        )
    }
}
