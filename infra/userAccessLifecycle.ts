import config from "../config"
import { userPool, userPoolClient } from "./cognito"
import { rds, vpc } from "./db"

const folderPrefix = "packages/functions/src/UserAccessLifecycle/functions"

const userAccessEventPattern = {
    source: ["ceyhunlar.user-access"],
    "detail-type": ["user.access.updated"],
}

export const userAccessBus = new sst.aws.Bus("UserAccessBus")

/**
 * Üretim canlı güncellemesi (4.4): `/uretim` ekranlarına "şu alan değişti" ipucu konusu. Yalnız
 * üretim yazma uçları yayınlar (ProtectedApi), yalnız üretim yetkili ACTIVE kullanıcılar abone
 * olur (yetkilendirici, `realtimeAccess.ts`). Konu adının tek kaynağı burası.
 */
export const productionRealtimeTopic = `${$app.name}/${$app.stage}/production/changes`

/** Kullanıcı bildirim konusunun öneki: `${önek}/${dbUserId}` (bildirim zili dinler). */
export const userNotificationTopicPrefix = `${$app.name}/${$app.stage}/notifications/users`

export const userAccessRealtime = new sst.aws.Realtime("UserAccessRealtime", {
    authorizer: {
        handler: `${folderPrefix}/userAccessRealtimeAuthorizer.handler`,
        runtime: "nodejs24.x",
        vpc,
        link: [rds],
        environment: {
            COGNITO_CLIENT_ID: userPoolClient.id,
            COGNITO_USER_POOL_ID: userPool.id,
            USER_ACCESS_REALTIME_TOPIC_PREFIX: `${$app.name}/${$app.stage}/users`,
            USER_NOTIFICATION_REALTIME_TOPIC_PREFIX: userNotificationTopicPrefix,
            PRODUCTION_REALTIME_TOPIC: productionRealtimeTopic,
        },
    },
})

userAccessBus.subscribe("PersistUserAccessNotification", {
    handler: `${folderPrefix}/persistUserAccessNotification.handler`,
    runtime: "nodejs24.x",
    vpc,
    link: [rds],
}, {
    pattern: userAccessEventPattern,
})

userAccessBus.subscribe("SendUserAccessEmail", {
    handler: `${folderPrefix}/sendUserAccessEmail.handler`,
    runtime: "nodejs24.x",
    environment: {
        USER_ACCESS_FROM_EMAIL: config.DOMAIN ? `noreply@${config.DOMAIN}` : "noreply@example.com",
    },
    permissions: [
        {
            actions: ["ses:SendEmail", "ses:SendRawEmail"],
            resources: ["*"],
        },
    ],
}, {
    pattern: userAccessEventPattern,
})

userAccessBus.subscribe("PublishUserAccessRealtime", {
    handler: `${folderPrefix}/publishUserAccessRealtime.handler`,
    runtime: "nodejs24.x",
    link: [userAccessRealtime],
    environment: {
        USER_ACCESS_REALTIME_TOPIC_PREFIX: `${$app.name}/${$app.stage}/users`,
    },
    permissions: [
        {
            actions: ["iot:Publish"],
            resources: ["*"],
        },
    ],
}, {
    pattern: userAccessEventPattern,
})
