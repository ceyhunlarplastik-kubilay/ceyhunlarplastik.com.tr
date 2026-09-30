import type { MqttClient } from "mqtt"

/**
 * Tarayıcının SST Realtime (AWS IoT) bağlantısı — bildirim zili ve üretim paneli AYNI kodu kullanır.
 * Yetkilendirme IoT özel yetkilendiricisinde: parola = Cognito kimlik jetonu; hangi konulara abone
 * olunabileceğine sunucu karar verir, tarayıcı hiçbir konuya yayın yapamaz.
 */

export type RealtimeEndpointConfig = { endpoint: string; authorizer: string }

/** Ortamda Realtime tanımlı değilse (yerel geliştirme, test) canlı güncelleme kapalıdır. */
export function readRealtimeEndpointConfig(): RealtimeEndpointConfig | null {
    const endpoint = process.env.NEXT_PUBLIC_REALTIME_ENDPOINT
    const authorizer = process.env.NEXT_PUBLIC_REALTIME_AUTHORIZER
    return endpoint && authorizer ? { endpoint, authorizer } : null
}

function createClientId() {
    const randomId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
    return `ceyhunlar_${randomId}`
}

export function createRealtimeConnection(
    mqttConnect: typeof import("mqtt")["default"]["connect"],
    input: RealtimeEndpointConfig & { token: string },
): MqttClient {
    return mqttConnect(`wss://${input.endpoint}/mqtt?x-amz-customauthorizer-name=${encodeURIComponent(input.authorizer)}`, {
        protocolVersion: 5,
        manualConnect: true,
        username: "",
        password: input.token,
        clientId: createClientId(),
        reconnectPeriod: 5000,
        connectTimeout: 10_000,
        clean: true,
    })
}

export function isRealtimeAuthorizationError(error: Error) {
    return /not authorized/i.test(error.message)
}

/** SUBACK'te 0x80 ve üstü başarısızlıktır (MQTT 5: 0x87 = yetkisiz). */
export function isSubscriptionRejected(granted: ReadonlyArray<{ qos: number; reasonCode?: number }> | undefined): boolean {
    return (granted ?? []).some((entry) => entry.qos >= 0x80 || (entry.reasonCode ?? 0) >= 0x80)
}
