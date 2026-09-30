import config from "../config"
import { rds, vpc } from "./db"
import { userAccessRealtime, userNotificationTopicPrefix } from "./userAccessLifecycle"

const isProd = $app.stage === "prod"

/**
 * Üretim uyarı taraması (4.5): geciken işler, termin riski ve bakımı gelen kalıplar için Üretim
 * Planlama rolüne kalıcı bildirim (zil) + canlı toast. İş kuralları
 * `core/helpers/production/productionAlerts.ts`, tarama `functions/src/ProductionAlerts/`.
 *
 * Prod'da her zaman kurulur (15 dk). Diğer stage'lerde YALNIZ `.env`'de
 * `PRODUCTION_ALERTS_ENABLED="true"` iken (5 dk — test ederken beklemek kısa sürsün): Neon boşta
 * uyur; sürekli tarama onu gün boyu uyandırıp işlem saati harcardı, `sst dev` kapalıyken de hata
 * veren çağrılar bırakırdı.
 *
 * Canlı yayın izni yalnız kullanıcı bildirim konularına (`…/notifications/users/*`); Realtime
 * bileşeni bilinçli olarak `link` edilmez (link `iot:Publish`'i `*`'a açar).
 */
export const productionAlertsCron = isProd || config.PRODUCTION_ALERTS_ENABLED
    ? new sst.aws.Cron("ProductionAlerts", {
        schedule: isProd ? "rate(15 minutes)" : "rate(5 minutes)",
        function: {
            handler: "packages/functions/src/ProductionAlerts/actions.handler",
            runtime: "nodejs24.x",
            timeout: "1 minute",
            vpc,
            link: [rds],
            environment: {
                PRODUCTION_ALERTS_REALTIME_ENDPOINT: userAccessRealtime.endpoint,
                USER_NOTIFICATION_REALTIME_TOPIC_PREFIX: userNotificationTopicPrefix,
                POWERTOOLS_SERVICE_NAME: "production-alerts",
                POWERTOOLS_LOG_LEVEL: isProd ? "INFO" : "DEBUG",
            },
            permissions: [
                {
                    actions: ["iot:Publish"],
                    resources: [
                        $interpolate`arn:aws:iot:${aws.getRegionOutput().name}:${aws.getCallerIdentityOutput().accountId}:topic/${userNotificationTopicPrefix}/*`,
                    ],
                },
            ],
        },
    })
    : undefined
