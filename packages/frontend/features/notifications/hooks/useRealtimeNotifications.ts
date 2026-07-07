"use client"

import { useEffect, useMemo } from "react"
import mqtt from "mqtt"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

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

function createClientId() {
    const randomId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
    return `ceyhunlar_${randomId}`
}

function createConnection(input: {
    endpoint: string
    authorizer: string
    token: string
}) {
    return mqtt.connect(`wss://${input.endpoint}/mqtt?x-amz-customauthorizer-name=${encodeURIComponent(input.authorizer)}`, {
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

function isAuthorizationError(error: Error) {
    return /not authorized/i.test(error.message)
}

export function useRealtimeNotifications({ enabled = true }: Options = {}) {
    const { data: session, status } = useSession()
    const queryClient = useQueryClient()
    const token = session?.idToken
    const userId = session?.user?.dbUserId

    const config = useMemo(() => {
        const endpoint = process.env.NEXT_PUBLIC_REALTIME_ENDPOINT
        const authorizer = process.env.NEXT_PUBLIC_REALTIME_AUTHORIZER
        const topicPrefix = process.env.NEXT_PUBLIC_REALTIME_NOTIFICATION_TOPIC_PREFIX

        if (!endpoint || !authorizer || !topicPrefix || !userId) return null

        return {
            endpoint,
            authorizer,
            topic: `${topicPrefix}/${userId}`,
        }
    }, [userId])

    useEffect(() => {
        if (!enabled || status !== "authenticated" || !token || !config) return

        const connection = createConnection({
            endpoint: config.endpoint,
            authorizer: config.authorizer,
            token,
        })

        connection.on("connect", () => {
            connection.subscribe(config.topic, { qos: 1 }, (error) => {
                if (error) {
                    console.error("Realtime notification subscription failed", error)
                }
            })
        })

        connection.on("message", (topic, payload) => {
            if (topic !== config.topic) return

            const notification = parsePayload(payload)
            if (!notification) return

            toast.info(notification.title, {
                description: notification.message,
            })

            void queryClient.invalidateQueries({ queryKey: ["my-notifications"] })
            void queryClient.invalidateQueries({ queryKey: ["business-requests"] })
        })

        connection.on("error", (error) => {
            if (isAuthorizationError(error)) {
                connection.end(true)
                return
            }

            console.error("Realtime notification connection error", error)
        })

        connection.connect()

        return () => {
            connection.end(true)
        }
    }, [config, enabled, queryClient, status, token])

    return {
        isConfigured: Boolean(config),
        topic: config?.topic ?? null,
    }
}
