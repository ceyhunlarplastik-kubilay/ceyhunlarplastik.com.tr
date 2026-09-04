import { rds, vpc } from "./db";
import { publicBucket } from "./storage";

// S3 ObjectCreated → Lambda: presign akışında PENDING_UPLOAD olarak oluşturulan
// Asset satırını ACTIVE'e çevirir (packages/functions/src/AssetLifecycle).
//
// Taşıma kararı (kullanıcı onaylı): EventBridge değil, doğrudan bucket
// notification. Handler'lar taşıma-bağımsız yazıldı; 2. tüketici (thumbnail /
// tarama) gerekirse Bus'a taşınır.
// Stage gate YOK: kubi pilotu bu Lambda'ları gerektiriyor ve tetik per-upload'dır
// (zamanlanmış maliyeti yok). Bucket'lar stage'e göre ayrı (SST bucket adına
// stage ekliyor) — kubi notification'ı prod'a dokunmaz.
//
// Kapsam ÇAKIŞMAYAN kardeş prefix'lerle genişliyor (IMPROVEMENT_PLAN kararı):
//  - `categories/`            → kategori asset'leri (PRIMARY demote-on-confirm)
//  - `product-supplier-codes/` → tedarikçi harfi teknik resmi (sadece PENDING→ACTIVE)
// Her handler kendi prefix guard'ını da içerir.
const confirmFunctionBase = {
    runtime: "nodejs24.x" as const,
    timeout: "1 minute" as const,
    vpc,
    link: [rds],
    logging: { retention: "1 month" as const },
    environment: {
        POWERTOOLS_SERVICE_NAME: "ceyhunlar-asset-lifecycle",
        POWERTOOLS_LOG_LEVEL: $app.stage === "prod" ? "INFO" : "DEBUG",
    },
};

publicBucket.notify({
    notifications: [
        {
            name: "ConfirmCategoryAssetUpload",
            function: {
                ...confirmFunctionBase,
                handler:
                    "packages/functions/src/AssetLifecycle/functions/confirmCategoryAssetUpload.handler",
            },
            events: ["s3:ObjectCreated:*"],
            filterPrefix: "categories/",
        },
        {
            name: "ConfirmProductSupplierCodeAssetUpload",
            function: {
                ...confirmFunctionBase,
                handler:
                    "packages/functions/src/AssetLifecycle/functions/confirmProductSupplierCodeAssetUpload.handler",
            },
            events: ["s3:ObjectCreated:*"],
            filterPrefix: "product-supplier-codes/",
        },
    ],
});
