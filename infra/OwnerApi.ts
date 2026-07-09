import config from "../config";
import { vpc, rds } from "./db";
import { userPool, userPoolClient } from "./cognito";
import { userAccessBus } from "./userAccessLifecycle";
import { apiCors } from "./cors";
import { apiRouteLambdaNamer } from "./lambdaNaming";

const folderPrefix = "packages/functions/src/OwnerApi/functions";

export const ownerApi = new sst.aws.ApiGatewayV2("CeyhunlarOwnerApi", {
    cors: apiCors,
    transform: {
        route: {
            handler: apiRouteLambdaNamer("owner"),
        },
    },
    domain:
        $app.stage === "prod"
            ? {
                name: `owner.api.${config.DOMAIN}`,
                dns: sst.aws.dns({
                    zone: config.HOSTED_ZONE_ID,
                }),
            }
            : $app.stage === "dev"
                ? {
                    name: `owner.dev.api.${config.DOMAIN}`,
                    dns: sst.aws.dns({
                        zone: config.HOSTED_ZONE_ID,
                    }),
                }
                : undefined,
});

/* ------------------------
 * JWT Authorizer (Cognito)
 * ------------------------ */
const jwtAuthorizer = ownerApi.addAuthorizer({
    name: "OwnerJwtAuthorizer",
    jwt: {
        issuer: $interpolate`https://cognito-idp.${aws.getRegionOutput().name}.amazonaws.com/${userPool.id}`,
        audiences: [userPoolClient.id],
        identitySource: "$request.header.Authorization",
    },
});

/* ------------------------
 * Default Lambda Route options
 * ------------------------ */
const defaultRouteOptions: Omit<sst.aws.FunctionArgs, "handler"> = {
    runtime: "nodejs22.x",
    vpc: vpc,
    link: [rds, userPool, userAccessBus],
    // P1.6 — structured logging (Powertools). retention "1 month" = SST varsayılanı (30gün).
    logging: { retention: "1 month" },
    environment: {
        POWERTOOLS_SERVICE_NAME: "ceyhunlar-owner-api",
        POWERTOOLS_LOG_LEVEL: $app.stage === "prod" ? "INFO" : "DEBUG",
    },
};

// 🔁 reusable auth config
const defaultAuthOptions: sst.aws.ApiGatewayV2RouteArgs = {
    auth: {
        jwt: {
            authorizer: jwtAuthorizer.id,
        },
    },
};

/*----------------------- USERS -----------------------*/
ownerApi.route("PUT /users/{id}/groups", {
    handler: `${folderPrefix}/users/actions.updateUserGroups`,
    ...defaultRouteOptions,
}, { ...defaultAuthOptions });
