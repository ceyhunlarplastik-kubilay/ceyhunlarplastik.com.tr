"use client"

import { useEffect, useRef, useState } from "react"
import { getSession, useSession } from "next-auth/react"

import { readRealtimeEndpointConfig } from "@/features/realtime/lib/realtimeConnection"
import { startRealtimeSubscription, type RealtimeConnectionStatus } from "@/features/realtime/lib/realtimeSubscription"

export type RealtimeStatus = "disabled" | RealtimeConnectionStatus

type Options = {
    /** `null`: abone olunacak konu yok (canlı güncelleme kapalı). */
    topic: string | null
    enabled?: boolean
    qos?: 0 | 1
    onMessage: (payload: Uint8Array) => void
    /** Abonelik kuruldu; `resumed` = daha önce de kuruluydu (arada mesaj kaçmış olabilir). */
    onSubscribed?: (info: { resumed: boolean }) => void
}

// Ortam ayarı derlemede sabitlenir; bileşen dışında bir kez okunur.
const endpointConfig = readRealtimeEndpointConfig()

/**
 * Tek bir Realtime konusuna abone olur ve bağlantı durumunu döndürür (bildirim zili ve üretim
 * paneli ortak). Yaşam döngüsü `realtimeSubscription.ts`'te: jeton HER bağlantıda `getSession()` ile
 * taze okunur — `useSession` verisi aynı sekmede kendiliğinden yenilenmez, saatlerce açık ekran eski
 * jetonla sessizce susardı.
 */
export function useRealtimeTopic({ topic, enabled = true, qos = 0, onMessage, onSubscribed }: Options): RealtimeStatus {
    const { status: sessionStatus } = useSession()
    const [status, setStatus] = useState<RealtimeConnectionStatus>("connecting")
    const handlers = useRef({ onMessage, onSubscribed })
    useEffect(() => {
        handlers.current = { onMessage, onSubscribed }
    })

    const active = enabled && sessionStatus === "authenticated" && Boolean(topic) && Boolean(endpointConfig)

    useEffect(() => {
        if (!active || !topic || !endpointConfig) return
        return startRealtimeSubscription({
            config: endpointConfig,
            topic,
            qos,
            getToken: async () => (await getSession())?.idToken ?? null,
            loadConnect: async () => (await import("mqtt")).default.connect,
            onStatus: setStatus,
            onMessage: (payload) => handlers.current.onMessage(payload),
            onSubscribed: (info) => handlers.current.onSubscribed?.(info),
        })
    }, [active, qos, topic])

    return active ? status : "disabled"
}
