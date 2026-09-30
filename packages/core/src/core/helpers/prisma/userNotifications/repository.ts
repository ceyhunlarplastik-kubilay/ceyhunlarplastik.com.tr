import { prisma } from "@/core/db/prisma"
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery"
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse"
import type { IPaginationQuery } from "@/core/helpers/pagination/types"
import { alertDeliveryKey } from "@/core/helpers/production/productionAlerts"
import type { Prisma } from "@/prisma/generated/prisma/client"

export type UserNotificationType =
    | "ACCESS_STATUS_CHANGED"
    | "ROLE_CHANGED"
    | "ASSIGNMENT_CHANGED"
    | "REQUEST_CREATED"
    | "APPROVAL_REQUIRED"
    | "REQUEST_DECIDED"
    /** Üretim uyarısı (4.5); alt tür `data.kind`, tekrar önleme anahtarı `data.alertKey`. */
    | "PRODUCTION_ALERT"

export type NotificationWrite = {
    userId: string
    type: UserNotificationType
    title: string
    message: string
    data?: Record<string, unknown> | null
}

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
    /** Toplu yazım (tek sorgu); yazılan satır sayısı. */
    createNotifications(rows: NotificationWrite[]): Promise<number>
    /**
     * Kullanıcılara `since`'ten beri teslim edilmiş üretim uyarısı anahtarları — `userId|alertKey`
     * (`core/helpers/production/productionAlerts.ts` `alertDeliveryKey`).
     */
    listDeliveredProductionAlertKeys(input: { userIds: string[]; since: Date }): Promise<Set<string>>
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
            data: input.data ? input.data as Prisma.InputJsonValue : undefined,
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

    const createNotifications = async (rows: NotificationWrite[]) => {
        if (rows.length === 0) return 0
        const result = await prisma.userNotification.createMany({
            data: rows.map((row) => ({
                userId: row.userId,
                type: row.type,
                title: row.title,
                message: row.message,
                data: row.data ? row.data as Prisma.InputJsonValue : undefined,
            })),
        })
        return result.count
    }

    const listDeliveredProductionAlertKeys = async ({ userIds, since }: { userIds: string[]; since: Date }) => {
        if (userIds.length === 0) return new Set<string>()
        const rows = await prisma.userNotification.findMany({
            where: { userId: { in: userIds }, type: "PRODUCTION_ALERT", createdAt: { gte: since } },
            select: { userId: true, data: true },
        })
        const keys = new Set<string>()
        for (const row of rows) {
            const alertKey = row.data && typeof row.data === "object" && !Array.isArray(row.data)
                ? (row.data as Record<string, unknown>).alertKey
                : undefined
            if (typeof alertKey === "string") keys.add(alertDeliveryKey(row.userId, alertKey))
        }
        return keys
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
        createNotifications,
        listDeliveredProductionAlertKeys,
        listNotifications,
        markAsRead,
    }
}
