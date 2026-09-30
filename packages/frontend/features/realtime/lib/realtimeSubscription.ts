import type { MqttClient } from "mqtt"

import {
    createRealtimeConnection,
    isRealtimeAuthorizationError,
    isSubscriptionRejected,
    type RealtimeEndpointConfig,
} from "@/features/realtime/lib/realtimeConnection"
import { readJwtExpirySeconds, realtimeRenewDelayMs } from "@/features/realtime/lib/tokenRenewal"

export type RealtimeConnectionStatus = "connecting" | "live" | "offline"

/** Jeton alınamadı / yetki ya da abonelik reddedildi: taze jetonla bu kadar sonra yeniden denenir. */
export const REALTIME_RETRY_DELAY_MS = 15_000

type MqttConnect = typeof import("mqtt")["default"]["connect"]

export type RealtimeSubscriptionOptions = {
    config: RealtimeEndpointConfig
    topic: string
    qos: 0 | 1
    /** Her bağlantıda TAZE jeton (oturumdan); yoksa `null`. */
    getToken: () => Promise<string | null>
    /** `mqtt` yalnız bağlanılacağı an yüklenir (panel paketinden çıkar). */
    loadConnect: () => Promise<MqttConnect>
    onStatus: (status: RealtimeConnectionStatus) => void
    onMessage: (payload: Uint8Array) => void
    /** Abonelik kuruldu; `resumed` = daha önce de kurulmuştu (arada mesaj kaçmış olabilir). */
    onSubscribed: (info: { resumed: boolean }) => void
    now?: () => number
    logError?: (message: string, error: unknown) => void
}

/**
 * Tek konuya abonelik yaşam döngüsü — React'ten bağımsız (test edilebilir); `useRealtimeTopic` sarar.
 *
 *  - Her bağlantıda taze jeton alınır; jeton dolmadan önce yeni jetonla yeniden bağlanılır (sunucu
 *    bağlantıyı jeton dolunca keser).
 *  - Yetki ya da abonelik reddinde bağlantı bırakılır, kısa süre sonra taze jetonla yeniden denenir
 *    (`mqtt`'nin kendi yeniden bağlanması eski jetonu kullanırdı).
 *  - Yalnız GÜNCEL bağlantının olayları işlenir: yenilenen eski bağlantının kapanışı yenisini ezmez.
 *
 * Dönen fonksiyon aboneliği durdurur.
 */
export function startRealtimeSubscription(options: RealtimeSubscriptionOptions): () => void {
    const now = options.now ?? Date.now
    const logError = options.logError ?? ((message: string, error: unknown) => console.error(message, error))
    let stopped = false
    let client: MqttClient | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let subscribedOnce = false

    function schedule(delayMs: number) {
        clearTimeout(timer)
        timer = setTimeout(() => void open(), delayMs)
    }

    function drop(connection: MqttClient) {
        connection.end(true)
        if (client === connection) client = null
        options.onStatus("offline")
        schedule(REALTIME_RETRY_DELAY_MS)
    }

    async function open() {
        client?.end(true)
        client = null
        const token = await options.getToken()
        if (stopped) return
        if (!token) {
            options.onStatus("offline")
            schedule(REALTIME_RETRY_DELAY_MS)
            return
        }
        const connect = await options.loadConnect()
        if (stopped) return

        const connection = createRealtimeConnection(connect, { ...options.config, token })
        client = connection
        const isCurrent = () => !stopped && client === connection

        connection.on("connect", () => {
            connection.subscribe(options.topic, { qos: options.qos }, (error, granted) => {
                if (!isCurrent()) return
                if (error || isSubscriptionRejected(granted)) {
                    drop(connection)
                    return
                }
                options.onStatus("live")
                options.onSubscribed({ resumed: subscribedOnce })
                subscribedOnce = true
            })
        })
        connection.on("message", (messageTopic, payload) => {
            if (isCurrent() && messageTopic === options.topic) options.onMessage(payload)
        })
        connection.on("reconnect", () => {
            if (isCurrent()) options.onStatus("connecting")
        })
        connection.on("offline", () => {
            if (isCurrent()) options.onStatus("offline")
        })
        connection.on("error", (error) => {
            if (!isCurrent()) return
            if (isRealtimeAuthorizationError(error)) {
                drop(connection)
                return
            }
            logError("Realtime connection error", error)
        })

        connection.connect()
        schedule(realtimeRenewDelayMs(readJwtExpirySeconds(token), now()))
    }

    void open()
    return () => {
        stopped = true
        clearTimeout(timer)
        client?.end(true)
        client = null
    }
}
