/**
 * `assignProductVariantCodes` planını veritabanına uygular.
 *
 * İKİ FAZLI YAZMA — neden gerekli:
 * Taslak modda yeniden numaralandırma 1↔2 gibi TAKAS üretebilir. `ProductSize`
 * üzerindeki `@@unique([productId, code])` bir unique INDEX'tir; Postgres'te unique
 * index ERTELENEMEZ (yalnız unique CONSTRAINT deferrable olabilir, Prisma index
 * üretir). Tek bir `UPDATE … FROM UNNEST` ifadesi satırları sırayla işlediği için
 * takasın ortasında geçici bir çakışma oluşur ve ifade "duplicate key value"
 * ile düşer. Çözüm: önce etkilenen satırların kodlarını NEGATİFLE (negatif değerler
 * gerçek 1..N kodlarıyla asla çakışmaz), sonra nihai değerleri yaz.
 *
 * Toplu yazma `$executeRaw` + `UNNEST` ile yapılır: bir üründe birkaç yüz varyant
 * olabilir ve satır başına `update` üretmek Prisma'nın 5 sn'lik interaktif
 * transaction sınırını aşar (bkz. CLAUDE.md P2028 dersi ve
 * `products/industrialUsageFunctions.ts`).
 */

import { prisma } from "@/core/db/prisma"
import { chunkForBulkWrite } from "@/core/helpers/products/industrialUsageFunctionPlan"
import type { ProductVariantCodePlan } from "./assignProductVariantCodes"

// Client `$extends`'li olduğu için `Prisma.TransactionClient` uymuyor —
// aynı desen industrialUsageFunctions.ts ve businessRequests/service.ts'te.
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

export type ProductVariantCodeWriteStats = {
    sizeCodes: number
    versionCodes: number
    supplierCodes: number
    variantCodes: number
    variantSupplierCodes: number
}

/**
 * Tek kullanımlık çakışmaz değer ön eki. Gerçek kodlar yalnız rakam, nokta ve
 * büyük harf içerir; "~" hiçbir zaman geçerli bir kodun parçası olamaz.
 */
const CODE_PARK_PREFIX = "~"

async function writeIntCodes(
    tx: TransactionClient,
    table: "ProductSize" | "ProductVersion",
    updates: Array<{ id: string; code: number }>,
) {
    for (const chunk of chunkForBulkWrite(updates)) {
        const ids = chunk.map((update) => update.id)
        const codes = chunk.map((update) => update.code)

        if (table === "ProductSize") {
            await tx.$executeRaw`
                UPDATE "ProductSize" AS target
                SET "code" = source.code, "updatedAt" = NOW()
                FROM UNNEST(${ids}::text[], ${codes}::int[]) AS source(id, code)
                WHERE target."id" = source.id
            `
        } else {
            await tx.$executeRaw`
                UPDATE "ProductVersion" AS target
                SET "code" = source.code, "updatedAt" = NOW()
                FROM UNNEST(${ids}::text[], ${codes}::int[]) AS source(id, code)
                WHERE target."id" = source.id
            `
        }
    }
}

/**
 * FAZ 1 — güncellenecek satırların mevcut kodlarını geçici olarak "park et".
 *
 * Yeni satırlar NİHAİ kodlarıyla INSERT edildiği için bu faz insert'lerden ÖNCE
 * çalışmak zorundadır: taslakta araya bir ölçü girdiğinde yeni satırın alacağı kod
 * (ör. 2) hâlâ mevcut bir satırın üzerindedir ve insert `@@unique([productId, code])`
 * kısıtını ihlal eder. Aynı sorun `ProductVariant.fullCode` ve
 * `ProductVariantSupplier.fullCode` için de geçerlidir (ikisi de global unique).
 */
export async function negateProductVariantCodes(
    tx: TransactionClient,
    plan: ProductVariantCodePlan,
): Promise<void> {
    // KRİTİK: yalnız GÜNCELLENECEK satırlar park edilir. Ürünün tüm satırlarını
    // park etmek, değişmeyen bir satırın park edilip faz 2'de geri yazılmaması
    // demek olurdu — kod kalıcı olarak negatif/"~" ön ekli kalırdı.
    const sizeIds = plan.sizeCodeUpdates.filter((u) => u.previousCode !== null).map((u) => u.id)
    if (sizeIds.length > 0) {
        await tx.$executeRaw`UPDATE "ProductSize" SET "code" = -"code" WHERE "id" = ANY(${sizeIds}::text[])`
    }

    const versionIds = plan.versionCodeUpdates.filter((u) => u.previousCode !== null).map((u) => u.id)
    if (versionIds.length > 0) {
        await tx.$executeRaw`UPDATE "ProductVersion" SET "code" = -"code" WHERE "id" = ANY(${versionIds}::text[])`
    }

    // fullCode metin ve GLOBAL unique — negatiflenemez, ön ekle park edilir.
    const variantIds = plan.variantCodeUpdates.filter((u) => u.previousFullCode !== null).map((u) => u.id)
    if (variantIds.length > 0) {
        await tx.$executeRaw`
            UPDATE "ProductVariant" SET "fullCode" = ${CODE_PARK_PREFIX} || "fullCode"
            WHERE "id" = ANY(${variantIds}::text[])
        `
    }

    const variantSupplierIds = plan.variantSupplierCodeUpdates
        .filter((u) => u.previousFullCode !== null)
        .map((u) => u.id)
    if (variantSupplierIds.length > 0) {
        await tx.$executeRaw`
            UPDATE "ProductVariantSupplier" SET "fullCode" = ${CODE_PARK_PREFIX} || "fullCode"
            WHERE "id" = ANY(${variantSupplierIds}::text[])
        `
    }
}

/**
 * FAZ 2 — nihai kodları yaz. ÇAĞIRAN BİR TRANSACTION İÇİNDE OLMALIDIR: negatifleme
 * ile bu faz arasında kalan aralık dışarıdan görülmemelidir.
 *
 * `negationAlreadyApplied` yalnız `productVariantWriter` tarafından verilir; o akış
 * negatiflemeyi insert'lerden önce kendisi çalıştırır.
 */
export async function writeProductVariantCodes(
    tx: TransactionClient,
    productId: string,
    plan: ProductVariantCodePlan,
    options: { negationAlreadyApplied?: boolean } = {},
): Promise<ProductVariantCodeWriteStats> {
    if (!options.negationAlreadyApplied) {
        await negateProductVariantCodes(tx, plan)
    }

    await writeIntCodes(tx, "ProductSize", plan.sizeCodeUpdates)
    await writeIntCodes(tx, "ProductVersion", plan.versionCodeUpdates)

    for (const chunk of chunkForBulkWrite(plan.supplierCodeUpdates)) {
        const ids = chunk.map((update) => update.id)
        const codes = chunk.map((update) => update.code)
        await tx.$executeRaw`
            UPDATE "ProductSupplierCode" AS target
            SET "code" = source.code, "updatedAt" = NOW()
            FROM UNNEST(${ids}::text[], ${codes}::text[]) AS source(id, code)
            WHERE target."id" = source.id
        `
    }

    for (const chunk of chunkForBulkWrite(plan.variantCodeUpdates)) {
        const ids = chunk.map((update) => update.id)
        const fullCodes = chunk.map((update) => update.fullCode)
        await tx.$executeRaw`
            UPDATE "ProductVariant" AS target
            SET "fullCode" = source.full_code, "updatedAt" = NOW()
            FROM UNNEST(${ids}::text[], ${fullCodes}::text[]) AS source(id, full_code)
            WHERE target."id" = source.id
        `
    }

    for (const chunk of chunkForBulkWrite(plan.variantSupplierCodeUpdates)) {
        const ids = chunk.map((update) => update.id)
        const fullCodes = chunk.map((update) => update.fullCode)
        const supplierCodes = chunk.map((update) => update.supplierCode)
        await tx.$executeRaw`
            UPDATE "ProductVariantSupplier" AS target
            SET "fullCode" = source.full_code,
                "supplierCode" = source.supplier_code,
                "updatedAt" = NOW()
            FROM UNNEST(${ids}::text[], ${fullCodes}::text[], ${supplierCodes}::text[])
                AS source(id, full_code, supplier_code)
            WHERE target."id" = source.id
        `
    }

    return {
        sizeCodes: plan.sizeCodeUpdates.length,
        versionCodes: plan.versionCodeUpdates.length,
        supplierCodes: plan.supplierCodeUpdates.length,
        variantCodes: plan.variantCodeUpdates.length,
        variantSupplierCodes: plan.variantSupplierCodeUpdates.length,
    }
}
