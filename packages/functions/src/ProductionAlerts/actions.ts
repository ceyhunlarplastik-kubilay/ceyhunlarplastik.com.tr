import { productionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import { productionCalendarExceptionRepository } from "@/core/helpers/prisma/productionCalendarExceptions/repository"
import { productionJobRepository } from "@/core/helpers/prisma/productionJobs/repository"
import { productionMachineDowntimeRepository } from "@/core/helpers/prisma/productionMachineDowntimes/repository"
import { productionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import { productionMoldRepository } from "@/core/helpers/prisma/productionMolds/repository"
import { productionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import { userNotificationRepository } from "@/core/helpers/prisma/userNotifications/repository"
import { userRepository } from "@/core/helpers/prisma/users/repository"
import { logger } from "@/core/logger"
import { runProductionAlertSweep } from "@/functions/ProductionAlerts/sweep"
import { createUserNotificationPublisher } from "@/functions/shared/realtime/userNotificationPublisher"

/**
 * Zamanlanmış üretim uyarı taraması (4.5): prod'da 15 dk'da bir; diğer stage'lerde yalnız `.env`'de
 * `PRODUCTION_ALERTS_ENABLED="true"` iken (5 dk) — `infra/productionAlerts.ts`.
 */
export async function handler() {
    const result = await runProductionAlertSweep({
        userRepository: userRepository(),
        userNotificationRepository: userNotificationRepository(),
        productionJobRepository: productionJobRepository(),
        productionMoldRepository: productionMoldRepository(),
        productionMachineRepository: productionMachineRepository(),
        productionAreaRepository: productionAreaRepository(),
        productionShiftPatternRepository: productionShiftPatternRepository(),
        productionCalendarExceptionRepository: productionCalendarExceptionRepository(),
        productionMachineDowntimeRepository: productionMachineDowntimeRepository(),
        publishToUser: createUserNotificationPublisher({
            endpoint: process.env.PRODUCTION_ALERTS_REALTIME_ENDPOINT,
            topicPrefix: process.env.USER_NOTIFICATION_REALTIME_TOPIC_PREFIX,
        }),
        logWarning: (message, detail) => logger.warn(message, detail),
    })
    logger.info("Üretim uyarı taraması tamamlandı", result)
    return result
}
