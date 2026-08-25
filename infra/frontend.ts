import config from "../config";
import { userPool, userPoolClient } from "./cognito";
import { publicBucket } from "./storage";
import { appRouter } from "./router";
import { publicApi } from "./PublicApi";
import { adminApi } from "./AdminApi";
import { protectedApi } from "./ProtectedApi";
import { userAccessRealtime } from "./userAccessLifecycle";
import { vpc } from "./db";
import { googleMapsBrowserApiKey, googleMapsMapId } from "./googleMaps";

/* function parsePositiveIntegerEnv(name: string) {
  const value = process.env[name];
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

const frontendServerReservedConcurrency = parsePositiveIntegerEnv("FRONTEND_SERVER_RESERVED_CONCURRENCY"); */

export const frontend = new sst.aws.Nextjs("Ceyhunlar-Frontend", {
  path: "packages/frontend",
  // VPC KORUNUYOR. Frontend artık DB'ye dokunmuyor (P2.8), yani teknik olarak
  // VPC'siz de çalışabilir ve soğuk başlangıcı iyileşir — ama bu ağ yolunu
  // değiştiren ayrı bir karar (NAT üzerinden egress → doğrudan egress) ve
  // ölçülerek yapılmalı. Ayrı dilim.
  vpc,
  // `link: [rds]` KALDIRILDI (P2.8): frontend'de tek `@core/db/prisma` kullanıcısı
  // olan `user-access.ts` artık `GET /me/auth-state` ucunu çağırıyor. Bağ ölüydü
  // ve frontend Lambda'sına ihtiyacı olmayan DB kimlik bilgilerini taşıyordu.
  //
  // Doğrulandı: frontend hiçbir yerde `Resource.*` okumuyor ve import ettiği
  // sekiz `@core/*` modülünün hepsi saf (prisma/SST çekmiyor).

  // SST 3.19.3'ün default'u 3.9.14 (SST 4.17.1'de de aynı — yükseltmek bunu
  // değiştirmez). 3.9.14 `fetchInternalImage`'i sabit 4 argümanla çağırıyor;
  // Next 16.2.5+ araya `maximumResponseBody` ekledi → yerel public görseller
  // /_next/image üzerinden 500 veriyordu. 4.0.3 arite'yi sürüme göre seçiyor.
  // Bu satır kalkarsa `next` pin'i geri gelmeli.
  openNextVersion: "4.0.3",
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
    // BUILD-TIME değişken (SST `environment`'ı build komutuna da enjekte eder —
    // base-ssr-site.ts runBuild). OpenNext, image optimizer bundle'ına kendi
    // sharp'ını kurar ve default'u `0.32.6`'dır; yani prod'daki sharp
    // lockfile'daki sharp DEĞİLDİR ve `next` yükseltmesi ona dokunmaz.
    // 0.35.3 = libvips CVE-2026-33327/33328/35590/35591 düzeltmesi.
    // Node ≥20.9 ister. NOT: SST 4'ün Nextjs component'i runtime'ı nodejs24.x
    // olarak sabit kodluyor (bu yorum yazıldığında optimizer nodejs20.x'ti).
    SHARP_VERSION: "0.35.3",
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
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: googleMapsBrowserApiKey.value,
    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: googleMapsMapId.value,
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
