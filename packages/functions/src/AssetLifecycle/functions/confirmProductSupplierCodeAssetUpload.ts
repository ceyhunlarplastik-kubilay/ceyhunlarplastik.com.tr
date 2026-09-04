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

const KEY_PREFIX = "product-supplier-codes/"

/**
 * S3 ObjectCreated → (infra/assetLifecycle.ts `publicBucket.notify`) → bu Lambda.
 *
 * Tedarikçi sözlüğü teknik resmi presign akışının onay adımı: presign sırasında
 * PENDING_UPLOAD olarak oluşturulan Asset satırını, S3 nesnesi gerçekten
 * yazıldığında ACTIVE'e çevirir.
 *
 * - `confirmUploadedAsset` guard'ı idempotent + sıra-bağımsız (yalnız hâlâ
 *   PENDING_UPLOAD satırı çevirir): S3 en-az-bir-kez teslim eder → tekrar teslim
 *   / zaten ACTIVE = no-op.
 * - `filterPrefix: "product-supplier-codes/"` infra'da tanımlı; yine de burada da
 *   guard bırakıyoruz (yanlış tetik / ileride başka prefix).
 * - Kategori confirm'inden farkı: PRIMARY-demote yok (harf başına TEK resim,
 *   "değiştir" = eskiyi senkron DELETE + yeniyi yükle).
 * - Satır yoksa (elle yükleme, presign'sız) hata değil — sadece loglanır.
 */
export async function handler(event: S3ObjectCreatedEvent) {
    const repo = assetRepository()

    for (const record of event.Records ?? []) {
        const rawKey = record.s3?.object?.key
        if (!rawKey) continue

        // S3 key'i URL-encoded gelir: boşluk "+", diğer özel karakterler %XX.
        const key = decodeURIComponent(rawKey.replace(/\+/g, " "))

        if (!key.startsWith(KEY_PREFIX)) {
            console.info("supplier code drawing confirm skipped (prefix)", { key })
            continue
        }

        const { count, asset } = await repo.confirmUploadedAsset(key)

        if (count === 0) {
            console.info("supplier code drawing confirm no-op", { key, assetId: asset?.id ?? null })
            continue
        }

        console.info("supplier code drawing confirmed", {
            key,
            assetId: asset?.id ?? null,
            productSupplierCodeId: asset?.productSupplierCodeId ?? null,
        })
    }
}
