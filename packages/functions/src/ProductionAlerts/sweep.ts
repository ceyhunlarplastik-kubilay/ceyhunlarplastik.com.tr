import type { IPrismaProductionAreaRepository } from "@/core/helpers/prisma/productionAreas/repository"
import type { IPrismaProductionCalendarExceptionRepository } from "@/core/helpers/prisma/productionCalendarExceptions/repository"
import type { IPrismaProductionJobRepository } from "@/core/helpers/prisma/productionJobs/repository"
import type { IPrismaProductionMachineDowntimeRepository } from "@/core/helpers/prisma/productionMachineDowntimes/repository"
import type { IPrismaProductionMachineRepository } from "@/core/helpers/prisma/productionMachines/repository"
import type { IPrismaProductionMoldRepository } from "@/core/helpers/prisma/productionMolds/repository"
import type { IPrismaProductionShiftPatternRepository } from "@/core/helpers/prisma/productionShiftPatterns/repository"
import type { IUserNotificationRepository } from "@/core/helpers/prisma/userNotifications/repository"
import type { IPrismaUserRepository } from "@/core/helpers/prisma/users/repository"
import { forecastCalendarRange, forecastJobsOnMachines, remainingShotsByMold } from "@/core/helpers/production/jobForecast"
import { moldMaintenanceStatus } from "@/core/helpers/production/moldMaintenance"
import {
    jobAlerts,
    moldAlerts,
    pendingAlertDeliveries,
    PRODUCTION_ALERT_DEDUPE_LOOKBACK_DAYS,
    PRODUCTION_ALERT_NOTIFICATION_TYPE,
    PRODUCTION_ALERT_RECIPIENT_GROUPS,
    realtimeAlertSummary,
    type ProductionAlert,
} from "@/core/helpers/production/productionAlerts"
import { productionDateKey } from "@/core/helpers/production/productionTime"
import type { UserNotificationRealtimePayload } from "@/functions/shared/realtime/userNotificationPublisher"

const DAY_MS = 86_400_000

export type ProductionAlertSweepDeps = {
    userRepository: Pick<IPrismaUserRepository, "listActiveUsersByGroups">
    userNotificationRepository: Pick<IUserNotificationRepository, "createNotifications" | "listDeliveredProductionAlertKeys">
    productionJobRepository: Pick<IPrismaProductionJobRepository, "listJobsForAlerts" | "sumUpcomingPlannedShotsByMold">
    productionMoldRepository: Pick<IPrismaProductionMoldRepository, "listMolds">
    productionMachineRepository: Pick<IPrismaProductionMachineRepository, "listMachines">
    productionAreaRepository: Pick<IPrismaProductionAreaRepository, "listAreas">
    productionShiftPatternRepository: Pick<IPrismaProductionShiftPatternRepository, "listShiftPatterns">
    productionCalendarExceptionRepository: Pick<IPrismaProductionCalendarExceptionRepository, "listExceptions">
    productionMachineDowntimeRepository: Pick<IPrismaProductionMachineDowntimeRepository, "listDowntimes">
    /** Kullanıcının bildirim konusuna canlı yayın; yoksa (yapılandırma eksik) yalnız kalıcı bildirim. */
    publishToUser: ((userId: string, payload: UserNotificationRealtimePayload) => Promise<void>) | null
    logWarning?: (message: string, detail: Record<string, unknown>) => void
}

export type ProductionAlertSweepResult = { recipients: number; alerts: number; delivered: number }

/**
 * Üretim uyarı taraması (4.5; zamanlanmış görev — `infra/productionAlerts.ts`).
 *
 * Tahmin ve bakım durumu tahtadakiyle AYNI fonksiyonlardan (`jobForecast.ts`, `moldMaintenance.ts`);
 * hangi durumun bildirim olduğu ve tekrar önleme `productionAlerts.ts`'te. Her (kullanıcı × uyarı
 * anahtarı) bir kez yazılır; canlı yayın kullanıcı başına tek mesajdır ve başarısızlığı kalıcı
 * bildirimi etkilemez.
 */
export async function runProductionAlertSweep(deps: ProductionAlertSweepDeps, now: Date = new Date()): Promise<ProductionAlertSweepResult> {
    const recipients = await deps.userRepository.listActiveUsersByGroups(PRODUCTION_ALERT_RECIPIENT_GROUPS)
    // Alıcı yoksa hesap da yok (bildirim yazılmadığı için sonradan gelen planlayıcı süren uyarıları alır).
    if (recipients.length === 0) return { recipients: 0, alerts: 0, delivered: 0 }

    const today = productionDateKey(now)
    const calendarRange = forecastCalendarRange({ from: today, to: today, windowStart: now, windowEnd: now, now })
    const [machines, areas, patterns, exceptions, downtimes, jobs, upcomingShots, molds] = await Promise.all([
        deps.productionMachineRepository.listMachines(),
        deps.productionAreaRepository.listAreas(),
        deps.productionShiftPatternRepository.listShiftPatterns(),
        deps.productionCalendarExceptionRepository.listExceptions(calendarRange.exceptions),
        deps.productionMachineDowntimeRepository.listDowntimes(calendarRange.downtimes),
        deps.productionJobRepository.listJobsForAlerts(now),
        deps.productionJobRepository.sumUpcomingPlannedShotsByMold(now),
        deps.productionMoldRepository.listMolds(),
    ])

    const forecasts = forecastJobsOnMachines({
        jobs,
        machines,
        areaShiftPatternIds: Object.fromEntries(areas.map((area) => [area.id, area.shiftPatternId])),
        patterns,
        exceptions,
        downtimes,
        now,
    })

    const alerts: ProductionAlert[] = []
    for (const job of jobs) {
        const forecast = forecasts.get(job.id)
        if (!forecast) continue
        alerts.push(...jobAlerts({
            id: job.id,
            lotBaseNumber: job.lotBaseNumber,
            machineCode: job.machineCode,
            setupStartAt: job.setupStartAt,
            plannedEndAt: job.plannedEndAt,
            order: job.orders[0] ?? null,
        }, forecast))
    }

    // Bakım öngörüsü: sahadaki / başlaması gereken işlerin kalanı + gelecekteki planlı işler.
    const shotsAhead = remainingShotsByMold(jobs, forecasts)
    for (const [moldId, shots] of upcomingShots) shotsAhead.set(moldId, (shotsAhead.get(moldId) ?? 0) + shots)
    for (const mold of molds) {
        // Bakımdaki, arızalı ya da kullanım dışı kalıp için bakım uyarısı anlamsız.
        if (mold.status !== "ACTIVE") continue
        alerts.push(...moldAlerts(mold, moldMaintenanceStatus(mold, shotsAhead.get(mold.id) ?? 0)))
    }

    if (alerts.length === 0) return { recipients: recipients.length, alerts: 0, delivered: 0 }

    const recipientIds = recipients.map((recipient) => recipient.id)
    const delivered = await deps.userNotificationRepository.listDeliveredProductionAlertKeys({
        userIds: recipientIds,
        since: new Date(now.getTime() - PRODUCTION_ALERT_DEDUPE_LOOKBACK_DAYS * DAY_MS),
    })
    const deliveries = pendingAlertDeliveries(alerts, recipientIds, delivered)
    if (deliveries.length === 0) return { recipients: recipients.length, alerts: alerts.length, delivered: 0 }

    await deps.userNotificationRepository.createNotifications(deliveries.map(({ userId, alert }) => ({
        userId,
        type: PRODUCTION_ALERT_NOTIFICATION_TYPE,
        title: alert.title,
        message: alert.message,
        data: { kind: alert.kind, alertKey: alert.key, href: alert.href },
    })))

    const publish = deps.publishToUser
    if (publish) {
        const alertsByUser = new Map<string, ProductionAlert[]>()
        for (const { userId, alert } of deliveries) alertsByUser.set(userId, [...(alertsByUser.get(userId) ?? []), alert])
        await Promise.all([...alertsByUser].map(async ([userId, userAlerts]) => {
            try {
                await publish(userId, {
                    eventType: "production.alert",
                    notificationType: PRODUCTION_ALERT_NOTIFICATION_TYPE,
                    ...realtimeAlertSummary(userAlerts),
                    occurredAt: now.toISOString(),
                })
            } catch (error) {
                deps.logWarning?.("Üretim uyarısı canlı yayınlanamadı (bildirim kalıcı olarak yazıldı)", { userId, error })
            }
        }))
    }

    return { recipients: recipients.length, alerts: alerts.length, delivered: deliveries.length }
}
