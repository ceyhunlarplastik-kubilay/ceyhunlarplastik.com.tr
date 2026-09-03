import { assetRepository } from "@/core/helpers/prisma/assets/repository"

type S3ObjectCreatedRecord = {
    s3?: {
        object?: {
            key?: string
        }
    }
}

type S3ObjectCreatedEvent = {
    Records?: S3ObjectCreatedRecord[]
}

/**
 * S3 ObjectCreated → (infra/assetLifecycle.ts `publicBucket.notify`) → bu Lambda.
 *
 * Presign akışının onay adımı: presign sırasında PENDING_UPLOAD olarak oluşturulan
 * Asset satırını, S3 nesnesi gerçekten yazıldığında ACTIVE'e çevirir.
 *
 * - Guard idempotent + sıra-bağımsız (`confirmUploadedAsset` yalnız hâlâ
 *   PENDING_UPLOAD olan satırı çevirir): S3 en-az-bir-kez teslim eder, tekrar
 *   teslim / zaten ACTIVE = no-op.
 * - `filterPrefix: "categories/"` infra'da tanımlı; yine de burada da guard
 *   bırakıyoruz (yanlış tetik ya da ileride başka prefix eklenmesi).
 * - Satır yoksa (elle yükleme, presign'sız) hata değil — sadece loglanır.
 */
export async function handler(event: S3ObjectCreatedEvent) {
    const repo = assetRepository()

    for (const record of event.Records ?? []) {
        const rawKey = record.s3?.object?.key
        if (!rawKey) continue

        // S3 key'i URL-encoded gelir: boşluk "+", diğer özel karakterler %XX.
        const key = decodeURIComponent(rawKey.replace(/\+/g, " "))

        if (!key.startsWith("categories/")) {
            console.info("asset upload confirm skipped (prefix)", { key })
            continue
        }

        const { count, asset } = await repo.confirmUploadedAsset(key)

        if (count === 0) {
            console.info("asset upload confirm no-op", { key, assetId: asset?.id ?? null })
            continue
        }

        console.info("asset upload confirmed", {
            key,
            assetId: asset?.id ?? null,
            role: asset?.role ?? null,
        })

        // Yeni PRIMARY gerçekten doğrulandıysa aynı kategorinin diğer
        // PRIMARY'lerini düşür (eski akışta bu presign öncesi yapılıyordu).
        if (asset?.categoryId && asset.role === "PRIMARY") {
            const demoted = await repo.demoteOtherCategoryPrimaryAssets(asset.categoryId, asset.id)
            console.info("category primary demoted siblings", {
                categoryId: asset.categoryId,
                keepAssetId: asset.id,
                demotedCount: demoted.count,
            })
        }
    }
}
