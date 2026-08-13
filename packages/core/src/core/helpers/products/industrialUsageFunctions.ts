import { randomUUID } from "node:crypto"

import createError from "http-errors"

import { prisma } from "@/core/db/prisma"
import {
    buildIndustrialUsageFunctionWritePlan,
    chunkForBulkWrite,
    mapIndustrialUsageFunctionExport,
    type ApplyIndustrialUsageFunctionRow,
    type IndustrialUsageFunctionApplyStats,
    type IndustrialUsageFunctionExport,
    type IndustrialUsageFunctionWritePlan,
} from "@/core/helpers/products/industrialUsageFunctionPlan"

/**
 * Kullanım fonksiyonu Excel aktarımının prisma yüzeyi.
 *
 * Neden `PUT /products/{id}` yerine ayrı bir uç: ürün güncelleme yolu tüm ürünü
 * (varyantlar, attribute değerleri, görseller, taksonomi bağları) yeniden yazar.
 * Excel'den dönen veri ise yalnız METİN taşır; ürünün geri kalanını riske
 * atmadan satır+dil kırılımında nokta atışı yazmak gerekir.
 *
 * Doğrulama ve karar mantığı `industrialUsageFunctionPlan.ts` içinde (saf).
 */

const taxonomyValueSelect = {
    id: true,
    name: true,
    translations: {
        select: { locale: true, name: true },
    },
} as const

/** Excel'e yazılacak her şeyi TEK okumada toplar. */
export async function getProductIndustrialUsageFunctions(
    productId: string,
): Promise<IndustrialUsageFunctionExport> {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
            id: true,
            code: true,
            name: true,
            slug: true,
            category: { select: { name: true } },
            translations: { select: { locale: true, name: true } },
            industrialUsages: {
                orderBy: { displayOrder: "asc" },
                select: {
                    id: true,
                    displayOrder: true,
                    usageFunction: true,
                    sectorValue: { select: taxonomyValueSelect },
                    productionGroupValue: { select: taxonomyValueSelect },
                    usageAreaValue: { select: taxonomyValueSelect },
                    translations: {
                        select: { locale: true, usageFunction: true },
                    },
                },
            },
        },
    })

    if (!product) {
        throw new createError.NotFound("Ürün bulunamadı")
    }

    return mapIndustrialUsageFunctionExport(product)
}

export async function applyProductIndustrialUsageFunctions({
    productId,
    rows,
}: {
    productId: string
    rows: ApplyIndustrialUsageFunctionRow[]
}): Promise<IndustrialUsageFunctionApplyStats> {
    if (rows.length === 0) {
        throw new createError.BadRequest("İçe aktarılacak satır yok")
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
    })

    if (!product) {
        throw new createError.NotFound("Ürün bulunamadı")
    }

    const usages = await prisma.productIndustrialUsage.findMany({
        where: { id: { in: rows.map((row) => row.usageId) } },
        select: {
            id: true,
            productId: true,
            usageFunction: true,
            translations: {
                select: { locale: true, usageFunction: true },
            },
        },
    })

    const plan = buildIndustrialUsageFunctionWritePlan({ productId, rows, usages })

    if (plan.translationWrites.length === 0) return plan.stats

    await prisma.$transaction(
        async (tx) => {
            await writeBaseUsageFunctions(tx, plan.baseUpdates)
            await writeUsageFunctionTranslations(tx, plan.translationWrites)
        },
        {
            // Toplu ifadelerle iş saniyeler değil milisaniyeler sürüyor; bu süre
            // yalnız emniyet payı. Lambda'nın kendi zaman aşımının altında tutuldu.
            timeout: TRANSACTION_TIMEOUT_MS,
            maxWait: TRANSACTION_MAX_WAIT_MS,
        },
    )

    return plan.stats
}

/**
 * Neden ham SQL: satır başına bir `update`/`upsert` üretmek 224 satır × 14 dil
 * için ~3360 round-trip demek. Prod'da bu Prisma'nın 5 sn'lik varsayılan
 * transaction sınırını aştı (P2028) ve içe aktarma tamamen başarısız oldu.
 * Toplu ifadeyle aynı iş sorgu sayısından bağımsız hale gelir: 3360 yerine
 * ~8 ifade (500'lük parçalar).
 *
 * Prisma'nın `updateMany`/`createMany` bu işi yapamıyor: `updateMany` tek bir
 * değeri tüm satırlara yazar (satır başına FARKLI metin gerekiyor),
 * `createMany` ise `skipDuplicates` ile mevcut satırı GÜNCELLEMEZ.
 */
const TRANSACTION_TIMEOUT_MS = 15_000
const TRANSACTION_MAX_WAIT_MS = 10_000

// Client `$extends`'li olduğu için `Prisma.TransactionClient` uymuyor; repoda
// businessRequests/service.ts ile aynı çıkarım deseni.
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

/** TR metni: `ProductIndustrialUsage.usageFunction` base kolonu. */
async function writeBaseUsageFunctions(
    tx: TransactionClient,
    updates: IndustrialUsageFunctionWritePlan["baseUpdates"],
) {
    for (const chunk of chunkForBulkWrite(updates)) {
        const ids = chunk.map((update) => update.usageId)
        const texts = chunk.map((update) => update.usageFunction)

        await tx.$executeRaw`
            UPDATE "ProductIndustrialUsage" AS target
            SET "usageFunction" = source.usage_function,
                "updatedAt" = NOW()
            FROM UNNEST(${ids}::text[], ${texts}::text[]) AS source(id, usage_function)
            WHERE target."id" = source.id
        `
    }
}

/**
 * Çeviri satırları. `imageKey` bilinçli olarak YAZILMAZ: locale'e özgü görseller
 * bu akışın dışında yönetiliyor, metin aktarımı onlara dokunmamalı — bu yüzden
 * `ON CONFLICT` yalnız `usageFunction` ve `updatedAt` alanlarını günceller.
 *
 * `id` ve `updatedAt` uygulamada üretilir: ikisinin de DB tarafında varsayılanı
 * yok (`@default(uuid())` / `@updatedAt` Prisma seviyesindedir).
 *
 * ⚠️ ZORUNLU ÖN KOŞUL: aynı ifadede aynı (usageId, locale) çifti İKİ KEZ
 * bulunamaz — Postgres "ON CONFLICT DO UPDATE command cannot affect row a
 * second time" ile patlar. Bunu `buildIndustrialUsageFunctionWritePlan`
 * garanti eder (aynı kullanım satırını iki kez reddeder, diller ise map
 * anahtarı olduğu için satır başına tekildir). O garanti kaldırılırsa bu SQL
 * kırılır.
 */
async function writeUsageFunctionTranslations(
    tx: TransactionClient,
    writes: IndustrialUsageFunctionWritePlan["translationWrites"],
) {
    for (const chunk of chunkForBulkWrite(writes)) {
        const ids = chunk.map(() => randomUUID())
        const usageIds = chunk.map((write) => write.usageId)
        const locales = chunk.map((write) => write.locale)
        const texts = chunk.map((write) => write.usageFunction)

        await tx.$executeRaw`
            INSERT INTO "ProductIndustrialUsageTranslation" (
                "id", "productIndustrialUsageId", "locale", "usageFunction", "createdAt", "updatedAt"
            )
            SELECT source.id, source.usage_id, source.locale, source.usage_function, NOW(), NOW()
            FROM UNNEST(
                ${ids}::text[],
                ${usageIds}::text[],
                ${locales}::text[],
                ${texts}::text[]
            ) AS source(id, usage_id, locale, usage_function)
            ON CONFLICT ("productIndustrialUsageId", "locale")
            DO UPDATE SET
                "usageFunction" = EXCLUDED."usageFunction",
                "updatedAt" = NOW()
        `
    }
}
