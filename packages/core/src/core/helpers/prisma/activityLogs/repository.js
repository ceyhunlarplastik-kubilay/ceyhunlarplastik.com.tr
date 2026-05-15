import { prisma } from "@/core/db/prisma";
export const activityLogRepository = () => {
    const createLog = (data) => prisma.activityLog.create({
        data,
    });
    return {
        createLog,
    };
};
