import config from "../config"
import { rds, vpc } from "./db"

const folderPrefix = "packages/functions/src/UserAccessLifecycle/functions"

const userAccessEventPattern = {
    source: ["ceyhunlar.user-access"],
    "detail-type": ["user.access.updated"],
}

export const userAccessBus = new sst.aws.Bus("UserAccessBus")

export const userAccessRealtime = new sst.aws.Realtime("UserAccessRealtime", {
    authorizer: {
        handler: `${folderPrefix}/userAccessRealtimeAuthorizer.handler`,
        runtime: "nodejs22.x",
        vpc,
        link: [rds],
        environment: {
            USER_ACCESS_REALTIME_TOPIC_PREFIX: `${$app.name}/${$app.stage}/users`,
        },
    },
})

userAccessBus.subscribe("PersistUserAccessNotification", {
    handler: `${folderPrefix}/persistUserAccessNotification.handler`,
    runtime: "nodejs22.x",
    vpc,
    link: [rds],
}, {
    pattern: userAccessEventPattern,
})

userAccessBus.subscribe("SendUserAccessEmail", {
    handler: `${folderPrefix}/sendUserAccessEmail.handler`,
    runtime: "nodejs22.x",
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
    runtime: "nodejs22.x",
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
