import { prisma } from "@/core/db/prisma"
import type { Prisma } from "@/prisma/generated/prisma/client"

export interface IActivityLogRepository {
    createLog(data: Prisma.ActivityLogCreateInput): Promise<{
        id: string
        requestId: string | null
        actorUserId: string | null
        source: string
        eventType: string
        title: string
        description: string | null
        data: unknown
        createdAt: Date
    }>
}

export const activityLogRepository = (): IActivityLogRepository => {
    const createLog = (data: Prisma.ActivityLogCreateInput) =>
        prisma.activityLog.create({
            data,
        })

    return {
        createLog,
    }
}
