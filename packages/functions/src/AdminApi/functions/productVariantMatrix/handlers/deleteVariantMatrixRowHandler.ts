import createError, { HttpError } from "http-errors"

import { prisma } from "@/core/db/prisma"
import {
    recalculateProductVariantCodes,
    removeOrphanSizes,
} from "@/core/helpers/productVariants/productVariantMaintenance"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IProductVariantMatrixDependencies,
    IDeleteVariantMatrixSupplierEvent,
    IDeleteVariantMatrixVariantEvent,
} from "@/functions/AdminApi/types/productVariantMatrix"

/** Varyantın bir tedarikçi satırını kaldırır; varyantın kendisi durur. */
export const deleteVariantMatrixSupplierHandler = ({ productRepository }: IProductVariantMatrixDependencies) => {
    return async (event: IDeleteVariantMatrixSupplierEvent) => {
        const { id: productId, supplierRowId } = event.pathParameters

        try {
            const product = await productRepository.getProduct(productId)
            if (!product) throw new createError.NotFound("Product not found")

            const existing = await prisma.productVariantSupplier.findUnique({
                where: { id: supplierRowId },
                select: { id: true, variant: { select: { productId: true } } },
            })
            if (!existing || existing.variant.productId !== productId) {
                throw new createError.NotFound("Variant supplier row not found for this product")
            }

            await prisma.productVariantSupplier.delete({ where: { id: supplierRowId } })

            // Tedarikçi harfi (ProductSupplierCode) BİLİNÇLİ olarak silinmez: harf bir
            // kez verildikten sonra o tedarikçiye aittir ve geri dönerse aynı harfi
            // almalıdır (bkz. nextSupplierCode).
            return apiResponseDTO({ statusCode: 200, payload: { deletedId: supplierRowId } })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err)
            throw new createError.InternalServerError("Failed to delete variant supplier row")
        }
    }
}

/**
 * Varyantı tamamen siler, ardından öksüz kalan ölçü/versiyon kayıtlarını temizleyip
 * kodları yeniden hesaplar.
 *
 * Sipariş veya iş talebinde geçen bir varyant SİLİNMEZ: bu ilişkiler `SetNull`
 * olduğu için silme sessizce geçmişteki kalemin ürün bağını koparırdı. Müşteriye
 * özel fiyat, kampanya kalemi ve favori atamaları ise `Cascade` — bunlar da
 * habersiz kaybolmasın diye ayrıca engellenir.
 */
export const deleteVariantMatrixVariantHandler = ({ productRepository }: IProductVariantMatrixDependencies) => {
    return async (event: IDeleteVariantMatrixVariantEvent) => {
        const { id: productId, variantId } = event.pathParameters

        try {
            const product = await productRepository.getProduct(productId)
            if (!product) throw new createError.NotFound("Product not found")

            const existing = await prisma.productVariant.findUnique({
                where: { id: variantId },
                select: {
                    id: true,
                    productId: true,
                    fullCode: true,
                    _count: {
                        select: {
                            orderItems: true,
                            requestItems: true,
                            customerSpecialPrices: true,
                            campaignItems: true,
                            assignedToCustomers: true,
                        },
                    },
                },
            })
            if (!existing || existing.productId !== productId) {
                throw new createError.NotFound("Variant not found for this product")
            }

            const blockers: string[] = []
            if (existing._count.orderItems > 0) blockers.push(`${existing._count.orderItems} sipariş kalemi`)
            if (existing._count.requestItems > 0) blockers.push(`${existing._count.requestItems} iş talebi kalemi`)
            if (existing._count.customerSpecialPrices > 0) blockers.push(`${existing._count.customerSpecialPrices} özel fiyat`)
            if (existing._count.campaignItems > 0) blockers.push(`${existing._count.campaignItems} kampanya kalemi`)
            if (existing._count.assignedToCustomers > 0) blockers.push(`${existing._count.assignedToCustomers} müşteri ataması`)

            if (blockers.length > 0) {
                throw new createError.Conflict(
                    `${existing.fullCode} silinemez — şunlarda kullanılıyor: ${blockers.join(", ")}.`,
                )
            }

            const result = await prisma.$transaction(async (tx) => {
                await tx.productVariant.delete({ where: { id: variantId } })
                // Versiyon tanımı sözlükte kalır (numarası kalıcı); yalnız ölçüler temizlenir.
                const orphans = await removeOrphanSizes(tx, productId)
                const recalculated = await recalculateProductVariantCodes(tx, productId)
                return { orphans, recalculated }
            }, { timeout: 15_000, maxWait: 10_000 })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    deletedId: variantId,
                    removedSizes: result.orphans.sizes,
                    rewrittenCodes: result.recalculated.rewrittenCodes,
                },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err)
            throw new createError.InternalServerError("Failed to delete variant")
        }
    }
}
