import { prisma } from "@/core/db/prisma";
import { buildPaginationQuery } from "@/core/helpers/pagination/buildPaginationQuery";
import { buildPaginationResponse } from "@/core/helpers/pagination/buildPaginationResponse";
export const userNotificationRepository = () => {
    const createNotification = async (input) => prisma.userNotification.create({
        data: {
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message,
            data: input.data ?? undefined,
        },
    });
    const listNotifications = async (userId, query) => {
        const { where, orderBy, skip, take, page, limit, } = buildPaginationQuery(query, {
            defaultSort: "createdAt",
        });
        const mergedWhere = {
            ...where,
            userId,
        };
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
        ]);
        return {
            ...buildPaginationResponse(data, {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }),
            unreadCount,
        };
    };
    const markAsRead = async (userId, notificationId) => {
        const existing = await prisma.userNotification.findFirst({
            where: {
                id: notificationId,
                userId,
            },
        });
        if (!existing)
            return null;
        return prisma.userNotification.update({
            where: {
                id: notificationId,
            },
            data: {
                readAt: existing.readAt ?? new Date(),
            },
        });
    };
    return {
        createNotification,
        listNotifications,
        markAsRead,
    };
};
