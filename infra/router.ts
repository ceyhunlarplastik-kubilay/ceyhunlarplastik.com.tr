import config from "../config";
import { publicBucket } from "./storage";

const isPermanentStage = ["prod", "dev"].includes($app.stage);

const domain =
    $app.stage === "prod"
        ? config.DOMAIN
        : $app.stage === "dev"
            ? `dev.${config.DOMAIN}`
            : undefined;

const hostedZone = isPermanentStage ? config.HOSTED_ZONE_ID : undefined;

export const appRouter =
    isPermanentStage && domain
        ? new sst.aws.Router("Ceyhunlar-AppRouter", {
            domain: {
                name: domain,
                aliases: [`*.${domain}`],
                dns: sst.aws.dns({
                    zone: hostedZone!,
                }),
            },
        })
        : undefined;

if (appRouter) {
    appRouter.routeBucket("/categories", publicBucket);
}
