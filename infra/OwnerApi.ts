import config from "../config";
import { rds } from "./db";
import { userPool, userPoolClient } from "./cognito";

const folderPrefix = "packages/functions/src/OwnerApi/functions";

export const ownerApi = new sst.aws.ApiGatewayV2("CeyhunlarOwnerApi", {
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
    runtime: "nodejs20.x",
    link: [rds, userPool],
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
