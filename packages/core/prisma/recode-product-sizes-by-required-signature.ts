/**
 * TEK SEFERLİK backfill: `ProductSize` kayıtlarını ZORUNLU ölçü imzasına göre yeniden
 * kodlar.
 *
 * Eski kural: ölçü "tüm dolu değerler + tedarikçi" ile tekilleşiyordu; aynı zorunlu
 * ölçüyü farklı tedarikçiler girince üç ayrı kod oluşuyordu (1.23.1 / 1.23.2 /
 * 1.23.3). Yeni kural: zorunlu ölçüleri eşleşen varyantlar tek kodu paylaşır
 * (1.23.1.V1.A / .B / .C).
 *
 * Ne yapar (ürün modeli başına, tek transaction):
 *  1. `mergeProductSizesByRequiredSignature` — zorunlu imzası aynı olan ölçüleri
 *     birleştirir (opsiyonel değerleri korur, varyant/tedarikçi linklerini taşır).
 *  2. `recalculateProductVariantCodes` — imza/sortKey'i tazeler ve tüm `fullCode`
 *     metinlerini tek kaynaktan yeniden yazar.
 *
 * NOT: append-only doktrini gereği kod BOŞLUKLARI doldurulmaz — birleşen grup,
 * eski kodlarının en küçüğünü alır (ör. 1/2/3 → 1; 2 ve 3 numarası boşta kalır).
 *
 * Çalıştırma:
 *   # non-prod (kubi/dev) — paylaşılan istemci doğrudan RDS/Neon'a bağlanır:
 *   npm run backfill:recode-product-sizes -w @ceyhunlarweb/core
 *
 *   # prod — paylaşılan istemci RDS Proxy'ye (VPC içi) bağlanır, `sst tunnel`
 *   # yalnız doğrudan RDS örneğini açar. Bu yüzden `prisma migrate`'in kullandığı
 *   # DIRECT_URL'i override olarak ver:
 *   BACKFILL_DATABASE_URL="$DIRECT_URL" npm run backfill:recode-product-sizes -w @ceyhunlarweb/core
 */

import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "./generated/prisma/client.js"
import { prisma as sharedPrisma } from "../src/core/db/prisma.js"
import { mergeProductSizesByRequiredSignature } from "../src/core/helpers/productVariants/mergeProductSizesByRequiredSignature.js"
import { recalculateProductVariantCodes } from "../src/core/helpers/productVariants/productVariantMaintenance.js"

/**
 * Prod'da paylaşılan istemci RDS Proxy'ye bağlanır (yalnız VPC içinden erişilir).
 * `BACKFILL_DATABASE_URL` verilirse (tünelden erişilen DIRECT_URL gibi) ona bağlı
 * AYRI bir istemci kurulur — soft-delete extension'ı bu backfill'i etkilemez.
 */
const overrideUrl = process.env.BACKFILL_DATABASE_URL
const ownClient = overrideUrl
    ? new PrismaClient({ adapter: new PrismaPg({ connectionString: overrideUrl }) })
    : null
const prisma = (ownClient ?? sharedPrisma) as unknown as typeof sharedPrisma

async function main() {
    const products = await prisma.product.findMany({
        where: { measurementRequirements: { some: {} } },
        select: { id: true, code: true, name: true },
        orderBy: { code: "asc" },
    })

    console.log(`Ölçü şablonu olan ${products.length} ürün modeli işlenecek.`)

    let mergedSizes = 0
    let movedVariants = 0
    let movedSupplierLinks = 0
    let skippedSizes = 0
    let rewrittenCodes = 0
    const failures: Array<{ code: string; error: string }> = []

    for (const product of products) {
        try {
            const summary = await prisma.$transaction(
                async (tx) => {
                    const merge = await mergeProductSizesByRequiredSignature(tx, product.id)
                    const recalc = await recalculateProductVariantCodes(tx, product.id)
                    return { merge, recalc }
                },
                { timeout: 60_000, maxWait: 15_000 },
            )

            mergedSizes += summary.merge.mergedSizes
            movedVariants += summary.merge.movedVariants
            movedSupplierLinks += summary.merge.movedSupplierLinks
            skippedSizes += summary.merge.skippedSizes
            rewrittenCodes += summary.recalc.rewrittenCodes

            if (
                summary.merge.mergedSizes > 0 ||
                summary.merge.skippedSizes > 0 ||
                summary.recalc.rewrittenCodes > 0
            ) {
                console.log(
                    `  ${product.code} (${product.name}): ` +
                        `birleşen ölçü ${summary.merge.mergedSizes}, ` +
                        `taşınan varyant ${summary.merge.movedVariants}, ` +
                        `taşınan tedarikçi linki ${summary.merge.movedSupplierLinks}, ` +
                        `atlanan ölçü ${summary.merge.skippedSizes}, ` +
                        `yeniden yazılan kod ${summary.recalc.rewrittenCodes}`,
                )
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            failures.push({ code: product.code, error: message })
            console.error(`  ${product.code} (${product.name}) BAŞARISIZ: ${message}`)
        }
    }

    console.log("\nBackfill tamamlandı.", {
        products: products.length,
        mergedSizes,
        movedVariants,
        movedSupplierLinks,
        skippedSizes,
        rewrittenCodes,
        failures: failures.length,
    })

    if (skippedSizes > 0) {
        console.warn(
            `\n${skippedSizes} ölçü dışarıdan referanslı (sipariş/talep/özel fiyat/kampanya/asset) ` +
                `olduğu için birleştirilemedi. Bunları elle incelemen gerekebilir.`,
        )
    }
    if (failures.length > 0) {
        console.error("\nBaşarısız ürün modelleri:", failures)
        process.exitCode = 1
    }
}

main()
    .catch((error) => {
        console.error("Backfill başarısız", error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        if (ownClient) await ownClient.$disconnect()
    })
