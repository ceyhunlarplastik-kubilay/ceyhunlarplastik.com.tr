import config from "../config";
import { vpc, rds } from "./db";
import { userPool, userPoolClient } from "./cognito";
import { publicBucket } from "./storage";

const folderPrefix = 'packages/functions/src/ProtectedApi/functions';

export const protectedApi = new sst.aws.ApiGatewayV2("CeyhunlarProtectedApi", {
    transform: {
        stage: (args) => {
            args.defaultRouteSettings = {
                throttlingRateLimit: 100,
                throttlingBurstLimit: 200,
            };
        }
    },
    domain:
        $app.stage === "prod"
            ? {
                name: `protected.api.${config.DOMAIN}`,
                dns: sst.aws.dns({
                    zone: config.HOSTED_ZONE_ID,
                }),
            }
            : $app.stage === "dev"
                ? {
                    name: `protected.dev.api.${config.DOMAIN}`,
                    dns: sst.aws.dns({
                        zone: config.HOSTED_ZONE_ID,
                    }),
                }
                : undefined,
});

const jwtAuthorizer = protectedApi.addAuthorizer({
    name: "ProtectedJWTAuthorizer",
    jwt: {
        issuer: $interpolate`https://cognito-idp.${aws.getRegionOutput().name}.amazonaws.com/${userPool.id}`,
        // issuer: https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_2zgv1k8Dy/.well-known/jwks.json,
        audiences: [userPoolClient.id],
        // identitySource: "$request.header.AccessToken"
        identitySource: "$request.header.Authorization"
    }
})

const defaultRouteOptions: Omit<sst.aws.FunctionArgs, 'handler'> = {
    // :::tip If you link the function to a resource, the permissions to access it are automatically added. :::
    /* permissions: [
      {
        actions: ["dynamodb:Query", "dynamodb:GetItem","dynamodb:PutItem", "states:StartExecution"],
        resources: [table.arn]
        // resources: ["arn:aws:dynamodb:eu-central-1:657914290529:table/portfolio-kubilay-kubilay-PortfolioTable-wzcszuuz"]
      }
    ] */
    runtime: 'nodejs22.x',
    vpc: vpc,
    link: [rds, userPool, publicBucket],
    environment: {
        BUCKET_NAME: publicBucket.name,
        ASSET_PUBLIC_BASE_URL:
            $app.stage === "prod"
                ? `https://cdn.${config.DOMAIN}`
                : $app.stage === "dev"
                    ? `https://dev.${config.DOMAIN}`
                    : $interpolate`https://${publicBucket.name}.s3.amazonaws.com`
    }
}

// 🔁 reusable auth config
const defaultAuthOptions: sst.aws.ApiGatewayV2RouteArgs = {
    auth: {
        jwt: {
            authorizer: jwtAuthorizer.id,
        },
    },
};

/*----------------------- USERS -----------------------*/

protectedApi.route('GET /users', {
    handler: `${folderPrefix}/users/actions.listUsers`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /users/{id}', {
    handler: `${folderPrefix}/users/actions.getUser`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /me', {
    handler: `${folderPrefix}/users/actions.getMe`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /me/permissions', {
    handler: `${folderPrefix}/users/actions.mePermissions`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

/*----------------------- COLORS -----------------------*/

protectedApi.route('GET /colors', {
    handler: `${folderPrefix}/colors/actions.listColors`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('GET /colors/{id}', {
    handler: `${folderPrefix}/colors/actions.getColor`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('POST /colors', {
    handler: `${folderPrefix}/colors/actions.createColor`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('PATCH /colors/{id}', {
    handler: `${folderPrefix}/colors/actions.updateColor`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

/*----------------------- SUPPLIER VARIANT PRICES -----------------------*/

protectedApi.route('GET /supplier/variant-prices', {
    handler: `${folderPrefix}/supplierVariantPrices/actions.listSupplierVariantPrices`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });

protectedApi.route('PUT /supplier/variant-prices/{id}', {
    handler: `${folderPrefix}/supplierVariantPrices/actions.updateSupplierVariantPrice`,
    ...defaultRouteOptions
}, { ...defaultAuthOptions });
