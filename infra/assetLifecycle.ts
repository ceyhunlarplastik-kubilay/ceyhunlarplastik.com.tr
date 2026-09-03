import { rds, vpc } from "./db";
import { publicBucket } from "./storage";

// S3 ObjectCreated → Lambda: presign akışında PENDING_UPLOAD olarak oluşturulan
// Asset satırını ACTIVE'e çevirir (packages/functions/src/AssetLifecycle).
//
// Pilot kapsam: yalnız kategori asset'leri — `filterPrefix: "categories/"`.
// Taşıma kararı (kullanıcı onaylı): EventBridge değil, doğrudan bucket
// notification. Tek tüketici var; handler taşıma-bağımsız yazıldı, 2. tüketici
// (thumbnail / tarama) gerekirse Bus'a taşınır.
// Stage gate YOK: kubi pilotu bu Lambda'yı gerektiriyor ve tetik per-upload'dır
// (zamanlanmış maliyeti yok). Bucket'lar stage'e göre ayrı (SST bucket adına
// stage ekliyor) — kubi notification'ı prod'a dokunmaz.
publicBucket.notify({
    notifications: [
        {
            name: "ConfirmCategoryAssetUpload",
            function: {
                handler:
                    "packages/functions/src/AssetLifecycle/functions/confirmCategoryAssetUpload.handler",
                runtime: "nodejs24.x",
                timeout: "1 minute",
                vpc,
                link: [rds],
                logging: { retention: "1 month" },
                environment: {
                    POWERTOOLS_SERVICE_NAME: "ceyhunlar-asset-lifecycle",
                    POWERTOOLS_LOG_LEVEL: $app.stage === "prod" ? "INFO" : "DEBUG",
                },
            },
            events: ["s3:ObjectCreated:*"],
            filterPrefix: "categories/",
        },
    ],
});
