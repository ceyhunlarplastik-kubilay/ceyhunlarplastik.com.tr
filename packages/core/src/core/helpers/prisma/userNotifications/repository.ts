import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"

export type UserNotificationType =
    | "ACCESS_STATUS_CHANGED"
    | "ROLE_CHANGED"
    | "ASSIGNMENT_CHANGED"
    | "REQUEST_CREATED"
    | "APPROVAL_REQUIRED"
    | "REQUEST_DECIDED"

export interface IUserNotificationRepository {
    createNotification(input: {
        userId: string
        type: UserNotificationType
        title: string
        message: string
        data?: Record<string, unknown> | null
    }): Promise<{
        id: string
        userId: string
        type: UserNotificationType
        title: string
        message: string
        data: unknown
        readAt: Date | null
        createdAt: Date
    }>
    listNotifications(userId: string, query: IPaginationQuery): Promise<{
        data: Array<{
            id: string
            userId: string
            type: UserNotificationType
            title: string
            message: string
            data: unknown
            readAt: Date | null
            createdAt: Date
        }>
        meta: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
        unreadCount: number
    }>
    markAsRead(userId: string, notificationId: string): Promise<{
        id: string
        userId: string
        type: UserNotificationType
        title: string
        message: string
        data: unknown
        readAt: Date | null
        createdAt: Date
    } | null>
}

export const userNotificationRepository = (): IUserNotificationRepository => {
    const createNotification = async (input: {
        userId: string
        type: UserNotificationType
        title: string
        message: string
        data?: Record<string, unknown> | null
    }) => prisma.userNotification.create({
        data: {
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message,
            data: input.data ?? undefined,
        },
    })

    const listNotifications = async (userId: string, query: IPaginationQuery) => {
        const {
            where,
            orderBy,
            skip,
            take,
            page,
            limit,
        } = buildPaginationQuery(query, {
            defaultSort: "createdAt",
        })

        const mergedWhere = {
            ...where,
            userId,
        }

        const [data, total, unreadCount] = await Promise.all([
            prisma.userNotification.findMany({
                where: mergedWhere,
                orderBy,
                skip,
                take,
            }),
            prisma.userNotification.count({ where: mergedWhere }),
            prisma.userNotification.count({
                where: {
                    userId,
                    readAt: null,
                },
            }),
        ])

        return {
            ...buildPaginationResponse(data, {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }),
            unreadCount,
        }
    }

    const markAsRead = async (userId: string, notificationId: string) => {
        const existing = await prisma.userNotification.findFirst({
            where: {
                id: notificationId,
                userId,
            },
        })

        if (!existing) return null

        return prisma.userNotification.update({
            where: {
                id: notificationId,
            },
            data: {
                readAt: existing.readAt ?? new Date(),
            },
        })
    }

    return {
        createNotification,
        listNotifications,
        markAsRead,
    }
}
