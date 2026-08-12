import createError from "http-errors"

import { prisma } from "@/core/db/prisma"
import {
    buildIndustrialUsageFunctionWritePlan,
    mapIndustrialUsageFunctionExport,
    type ApplyIndustrialUsageFunctionRow,
    type IndustrialUsageFunctionApplyStats,
    type IndustrialUsageFunctionExport,
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

    await prisma.$transaction([
        ...plan.baseUpdates.map(({ usageId, usageFunction }) =>
            prisma.productIndustrialUsage.update({
                where: { id: usageId },
                data: { usageFunction },
            }),
        ),
        // `imageKey` bilinçli olarak yazılmaz: locale'e özgü görseller bu akışın
        // dışında yönetiliyor, metin aktarımı onlara dokunmamalı.
        ...plan.translationWrites.map(({ usageId, locale, usageFunction }) =>
            prisma.productIndustrialUsageTranslation.upsert({
                where: {
                    productIndustrialUsageId_locale: {
                        productIndustrialUsageId: usageId,
                        locale,
                    },
                },
                create: {
                    productIndustrialUsageId: usageId,
                    locale,
                    usageFunction,
                },
                update: { usageFunction },
            }),
        ),
    ])

    return plan.stats
}
