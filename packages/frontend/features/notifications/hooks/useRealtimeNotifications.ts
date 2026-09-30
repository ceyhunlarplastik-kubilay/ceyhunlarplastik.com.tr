"use client"

import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useRealtimeTopic } from "@/features/realtime/hooks/useRealtimeTopic"

export type RealtimeNotificationPayload = {
    eventType: string
    notificationType: string
    title: string
    message: string
    requestId?: string
    requestType?: string
    domain?: string
    occurredAt?: string
}

type Options = {
    enabled?: boolean
}

function parsePayload(payload: Uint8Array): RealtimeNotificationPayload | null {
    try {
        const raw = new TextDecoder("utf-8").decode(payload)
        const parsed = JSON.parse(raw) as Partial<RealtimeNotificationPayload>

        if (!parsed.title || !parsed.message || !parsed.eventType || !parsed.notificationType) {
            return null
        }

        return parsed as RealtimeNotificationPayload
    } catch {
        return null
    }
}

/** Kullanıcının bildirim konusu: gelen bildirim toast olur, bildirim ve talep listeleri tazelenir. */
export function useRealtimeNotifications({ enabled = true }: Options = {}) {
    const { data: session } = useSession()
    const queryClient = useQueryClient()
    const userId = session?.user?.dbUserId
    const topicPrefix = process.env.NEXT_PUBLIC_REALTIME_NOTIFICATION_TOPIC_PREFIX
    const topic = topicPrefix && userId ? `${topicPrefix}/${userId}` : null

    const status = useRealtimeTopic({
        topic,
        enabled,
        qos: 1,
        onMessage: (payload) => {
            const notification = parsePayload(payload)
            if (!notification) return

            toast.info(notification.title, {
                description: notification.message,
            })

            void queryClient.invalidateQueries({ queryKey: ["my-notifications"] })
            void queryClient.invalidateQueries({ queryKey: ["business-requests"] })
        },
    })

    return {
        isConfigured: status !== "disabled",
        topic,
    }
}
