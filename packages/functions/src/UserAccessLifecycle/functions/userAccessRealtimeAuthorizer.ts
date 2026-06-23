import { userRepository } from "@/core/helpers/prisma/users/repository"
import { realtime } from "sst/aws/realtime"

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".")
        if (parts.length < 2) return null

        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
        const decoded = Buffer.from(padded, "base64").toString("utf-8")

        return JSON.parse(decoded) as Record<string, unknown>
    } catch {
        return null
    }
}

export const handler = realtime.authorizer(async (token) => {
    if (!token) {
        return { subscribe: [], publish: [] }
    }

    const payload = decodeJwtPayload(token)
    const sub = typeof payload?.sub === "string" ? payload.sub : null

    if (!sub) {
        return { subscribe: [], publish: [] }
    }

    const user = await userRepository().getUserByCognitoSub(sub)
    if (!user || !user.isActive) {
        return { subscribe: [], publish: [] }
    }

    const topicPrefix = process.env.USER_ACCESS_REALTIME_TOPIC_PREFIX
    if (!topicPrefix) {
        return { subscribe: [], publish: [] }
    }

    return {
        subscribe: [`${topicPrefix}/${sub}/access`],
        publish: [],
    }
})
