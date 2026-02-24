import config from "../config";
import { userPool, userPoolClient } from "./cognito";
// import { publicBucket } from "./storage";
// import { appRouter } from "./router";

export const frontend = new sst.aws.Nextjs("Ceyhunlar-Frontend", {
  path: "packages/frontend",

  // ✅ Router BURADA
  /* router: appRouter
    ? {
      instance: appRouter,
    }
    : undefined, */

  // link: [userPool, userPoolClient],

  environment: {
    STAGE: $app.stage,
    DOMAIN: config.DOMAIN,
    REGION: config.AWS_REGION,
    NEXTAUTH_URL: $app.stage === "prod"
      ? `https://${config.DOMAIN}`
      : $app.stage === "dev"
        ? `https://dev.${config.DOMAIN}`
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
  }
});

// for permanent stages
/* new aws.lambda.Permission("AllowPublicInvokeFunction", {
  function: frontend.nodes.server!.name,
  principal: "*",
  action: "lambda:InvokeFunction",
  statementId: "AllowPublicAccessViaFunctionUrl",
}); */

if ($app.stage === "prod" || $app.stage === "dev") {
  new aws.lambda.Permission("AllowPublicInvokeFunction", {
    function: frontend.nodes.server!.name,
    principal: "*",
    action: "lambda:InvokeFunction",
    statementId: "AllowPublicAccessViaFunctionUrl",
  });
}
