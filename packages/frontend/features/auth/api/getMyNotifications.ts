import { protectedApiClient } from "@/lib/http/client"

export type UserNotificationType =
    | "ACCESS_STATUS_CHANGED"
    | "ROLE_CHANGED"
    | "ASSIGNMENT_CHANGED"
    | "REQUEST_CREATED"
    | "APPROVAL_REQUIRED"
    | "REQUEST_DECIDED"

export type MyNotificationsResponse = {
    statusCode: number
    payload: {
        data: Array<{
            id: string
            userId: string
            type: UserNotificationType
            title: string
            message: string
            data?: Record<string, unknown> | null
            readAt?: string | null
            createdAt: string
        }>
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
        unreadCount: number
    }
}

export async function getMyNotifications() {
    const res = await protectedApiClient.get<MyNotificationsResponse>("/me/notifications", {
        params: {
            page: 1,
            limit: 20,
            sort: "createdAt",
            order: "desc",
        },
    })

    return res.data.payload
}
