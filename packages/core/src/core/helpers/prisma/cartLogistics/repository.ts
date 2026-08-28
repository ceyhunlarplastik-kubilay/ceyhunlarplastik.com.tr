import { prisma } from "@/core/db/prisma"
import {
    normalizeCartLogisticsVariantIds,
    type CartLogisticsVariantRow,
} from "@/core/helpers/logistics/cartLogistics"

export interface IPrismaCartLogisticsRepository {
    listVariantLogisticsRows(variantIds: readonly string[]): Promise<CartLogisticsVariantRow[]>
}

/**
 * Sepet lojistiğinin dar veri kapısı.
 *
 * Sorgu tedarikçi kimliği ve bütün ticari alanları bilinçli olarak seçmez. Aktif
 * satırların sayısı normalizasyon katmanına bırakılır; böylece legacy çoklu-aktif
 * veri sessizce ilk tedarikçiye düşmez.
 */
export const cartLogisticsRepository = (): IPrismaCartLogisticsRepository => ({
    listVariantLogisticsRows: async (variantIds) => {
        const normalizedIds = normalizeCartLogisticsVariantIds(variantIds)
        if (normalizedIds.length === 0) return []

        return prisma.productVariant.findMany({
            where: { id: { in: normalizedIds } },
            select: {
                id: true,
                variantSuppliers: {
                    where: { isActive: true },
                    // Durum kararı için 0 / 1 / 2+ ayrımı yeterli.
                    take: 2,
                    select: {
                        unitsPerPackage: true,
                        packageLengthMm: true,
                        packageWidthMm: true,
                        packageHeightMm: true,
                        packageWeightKg: true,
                    },
                },
            },
        })
    },
})
