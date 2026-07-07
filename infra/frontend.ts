import config from "../config";
import { userPool, userPoolClient } from "./cognito";
import { publicBucket } from "./storage";
import { appRouter } from "./router";
import { publicApi } from "./PublicApi";
import { adminApi } from "./AdminApi";
import { protectedApi } from "./ProtectedApi";
import { userAccessRealtime } from "./userAccessLifecycle";
import { rds, vpc } from "./db";

/* function parsePositiveIntegerEnv(name: string) {
  const value = process.env[name];
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

const frontendServerReservedConcurrency = parsePositiveIntegerEnv("FRONTEND_SERVER_RESERVED_CONCURRENCY"); */

export const frontend = new sst.aws.Nextjs("Ceyhunlar-Frontend", {
  path: "packages/frontend",
  vpc,
  link: [rds],
  /*   server: {
      memory: "2048 MB",
      timeout: "30 seconds",
    }, */

  // ✅ Router BURADA
  router: appRouter
    ? {
      instance: appRouter,
    }
    : undefined,

  // link: [publicBucket],

  environment: {
    STAGE: $app.stage,
    DOMAIN: config.DOMAIN,
    REGION: config.AWS_REGION,
    NEXTAUTH_URL: $app.stage === "prod"
      ? `https://${config.DOMAIN}`
      : $app.stage === "dev"
        ? `https://dev.${config.DOMAIN}`
        : $app.stage === "test-1"
          ? "https://d32mxh4ylm3z1k.cloudfront.net"
          : "http://localhost:3000",
    NEXTAUTH_SECRET: "generate-a-random-secret", // Should ideally be in sst.Secret but hardcoded for local demo
    COGNITO_CLIENT_ID: userPoolClient.id,
    COGNITO_CLIENT_SECRET: userPoolClient.secret,
    COGNITO_ISSUER: $interpolate`https://cognito-idp.${config.AWS_REGION}.amazonaws.com/${userPool.id}`,
    COGNITO_DOMAIN: $app.stage === "prod"
      ? `auth.${config.DOMAIN}`
      : $app.stage === "dev"
        ? `auth-dev.${config.DOMAIN}`
        : `ceyhunlar-${$app.stage}.auth.${config.AWS_REGION}.amazoncognito.com`,
    NEXT_PUBLIC_API_URL: publicApi.url,
    NEXT_PUBLIC_ADMIN_API_URL: adminApi.url,
    NEXT_PUBLIC_PROTECTED_API_URL: protectedApi.url,
    NEXT_PUBLIC_REALTIME_ENDPOINT: userAccessRealtime.endpoint,
    NEXT_PUBLIC_REALTIME_AUTHORIZER: userAccessRealtime.authorizer,
    NEXT_PUBLIC_REALTIME_NOTIFICATION_TOPIC_PREFIX: `${$app.name}/${$app.stage}/notifications/users`,
    NEXT_PUBLIC_USER_ACCESS_REALTIME_ENDPOINT: userAccessRealtime.endpoint,
    NEXT_PUBLIC_USER_ACCESS_REALTIME_AUTHORIZER: userAccessRealtime.authorizer,
    NEXT_PUBLIC_BUCKET_NAME: publicBucket.name,
    // ✅ presign helper public url üretmek için
    // ÖRN: ASSET_PUBLIC_BASE_URL: publicBucket.cdnUrl,
    /* ASSET_PUBLIC_BASE_URL:
      $app.stage === "prod"
        ? `https://cdn.${config.DOMAIN}`
        : $app.stage === "dev"
          ? `https://dev.${config.DOMAIN}`
          : `https://${publicBucket.name}.s3.amazonaws.com`, */
    ASSET_PUBLIC_BASE_URL:
      $app.stage === "prod"
        ? `https://cdn.${config.DOMAIN}`
        : $app.stage === "dev"
          ? `https://dev.${config.DOMAIN}`
          : $interpolate`https://${publicBucket.name}.s3.amazonaws.com`
  },
  /*   transform: {
      server: (args) => {
        if ($app.stage === "prod" && frontendServerReservedConcurrency) {
          args.concurrency = { reserved: frontendServerReservedConcurrency };
        }
      },
    } */
});

// for permanent stages
/* new aws.lambda.Permission("AllowPublicInvokeFunction", {
  function: frontend.nodes.server!.name,
  principal: "*",
  action: "lambda:InvokeFunction",
  statementId: "AllowPublicAccessViaFunctionUrl",
}); */

const frontendServer = frontend.nodes.server;

if (($app.stage === "prod" || $app.stage === "dev" || $app.stage === "test-1") && frontendServer) {
  new aws.lambda.Permission("AllowPublicInvokeFunction", {
    function: frontendServer.name,
    principal: "*",
    action: "lambda:InvokeFunction",
    statementId: "AllowPublicAccessViaFunctionUrl",
  });
}
