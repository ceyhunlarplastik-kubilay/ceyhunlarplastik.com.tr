import createError from "http-errors"

import { prisma } from "@/core/db/prisma"
import { Prisma } from "@/prisma/generated/prisma/client"

/**
 * Ürün modeline özel ölçü şablonu: bu modelde HANGİ ölçülerin girilmesi gerektiği.
 *
 * `Category.allowedAttributeValueIds`'in ürün-modeli karşılığıdır. Kategori tarafı
 * düz bir id listesiyle yetinebiliyor; burada ölçü başına etiket, birim ve sıralama
 * önceliği taşındığı için ilişki tablosu kullanılıyor.
 */

export const measurementRequirementInclude = {
    measurementType: {
        include: {
            translations: { orderBy: { locale: "asc" as const } },
        },
    },
    translations: { orderBy: { locale: "asc" as const } },
} satisfies Prisma.ProductMeasurementRequirementInclude

export type MeasurementRequirementWithRelations = Prisma.ProductMeasurementRequirementGetPayload<{
    include: typeof measurementRequirementInclude
}>

export type MeasurementRequirementInput = {
    /** Dolu ise mevcut satır güncellenir; boşsa yeni satır oluşur. */
    id?: string
    measurementTypeId: string
    label: string
    unit?: string | null
    isRequired?: boolean
    sortPriority?: number
    displayOrder?: number
    translations?: Array<{ locale: string; label: string }>
}

export interface IPrismaProductMeasurementRequirementRepository {
    listByProduct(productId: string): Promise<MeasurementRequirementWithRelations[]>
    /** Şablonu TAM olarak değiştirir; listede olmayan satırlar silinir. */
    replaceForProduct(
        productId: string,
        requirements: readonly MeasurementRequirementInput[],
    ): Promise<MeasurementRequirementWithRelations[]>
}

/** Sıralama her yerde aynı olmalı: şablon sırası ölçü KODUNU belirler. */
const requirementOrderBy = [
    { sortPriority: "asc" as const },
    { displayOrder: "asc" as const },
    { label: "asc" as const },
]

export const productMeasurementRequirementRepository = (): IPrismaProductMeasurementRequirementRepository => {
    const listByProduct = (productId: string) =>
        prisma.productMeasurementRequirement.findMany({
            where: { productId },
            orderBy: requirementOrderBy,
            include: measurementRequirementInclude,
        })

    const replaceForProduct = async (
        productId: string,
        requirements: readonly MeasurementRequirementInput[],
    ) => {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.productMeasurementRequirement.findMany({
                where: { productId },
                select: { id: true, label: true, _count: { select: { sizeValues: true } } },
            })

            const keptIds = new Set(
                requirements.map((requirement) => requirement.id).filter((id): id is string => Boolean(id)),
            )

            // KULLANIMDA olan bir gereksinim silinemez: ölçü kayıtları ona bağlı
            // (ProductSizeValue → Restrict). Prisma'nın P2003'üne bırakmak yerine
            // hangi ölçünün engel olduğunu açıkça söylüyoruz.
            const blocked = existing.filter(
                (requirement) => !keptIds.has(requirement.id) && requirement._count.sizeValues > 0,
            )
            if (blocked.length > 0) {
                throw new createError.Conflict(
                    `Bu ölçüler varyantlarda kullanıldığı için şablondan çıkarılamaz: ${blocked
                        .map((requirement) => requirement.label)
                        .join(", ")}`,
                )
            }

            const removedIds = existing
                .filter((requirement) => !keptIds.has(requirement.id))
                .map((requirement) => requirement.id)

            if (removedIds.length > 0) {
                await tx.productMeasurementRequirement.deleteMany({ where: { id: { in: removedIds } } })
            }

            const existingIds = new Set(existing.map((requirement) => requirement.id))

            for (const [index, requirement] of requirements.entries()) {
                const data = {
                    label: requirement.label.trim(),
                    unit: requirement.unit?.trim() || null,
                    isRequired: requirement.isRequired ?? true,
                    sortPriority: requirement.sortPriority ?? index,
                    displayOrder: requirement.displayOrder ?? index,
                }

                const requirementId = requirement.id && existingIds.has(requirement.id)
                    ? (await tx.productMeasurementRequirement.update({
                        where: { id: requirement.id },
                        data: { ...data, measurementTypeId: requirement.measurementTypeId },
                        select: { id: true },
                    })).id
                    : (await tx.productMeasurementRequirement.create({
                        data: { ...data, productId, measurementTypeId: requirement.measurementTypeId },
                        select: { id: true },
                    })).id

                // Çeviriler tam replace — gönderilmeyen dil silinir.
                await tx.productMeasurementRequirementTranslation.deleteMany({ where: { requirementId } })
                const translations = (requirement.translations ?? []).filter((entry) => entry.label.trim())
                if (translations.length > 0) {
                    await tx.productMeasurementRequirementTranslation.createMany({
                        data: translations.map((entry) => ({
                            requirementId,
                            locale: entry.locale,
                            label: entry.label.trim(),
                        })),
                    })
                }
            }

            return tx.productMeasurementRequirement.findMany({
                where: { productId },
                orderBy: requirementOrderBy,
                include: measurementRequirementInclude,
            })
        }, { timeout: 15_000, maxWait: 10_000 })
    }

    return { listByProduct, replaceForProduct }
}
