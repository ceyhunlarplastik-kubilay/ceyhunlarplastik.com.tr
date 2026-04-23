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
    appRouter.routeBucket("/products", publicBucket);
    appRouter.routeBucket("/product-variants", publicBucket);
    appRouter.routeBucket("/product-variant-suppliers", publicBucket);
    appRouter.routeBucket("/product-variant-measurements", publicBucket);
    appRouter.routeBucket("/product-variant-assets", publicBucket);
    appRouter.routeBucket("/product-variant-materials", publicBucket);
    appRouter.routeBucket("/product-variant-colors", publicBucket);
    appRouter.routeBucket("/product-variant-suppliers", publicBucket);
    appRouter.routeBucket("/product-variant-suppliers", publicBucket);
}
