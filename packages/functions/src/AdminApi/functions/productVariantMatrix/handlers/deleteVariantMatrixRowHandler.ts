import createError, { HttpError } from "http-errors"

import { prisma } from "@/core/db/prisma"
import {
    recalculateProductVariantCodes,
    removeOrphanSizes,
} from "@/core/helpers/productVariants/productVariantMaintenance"
import {
    VARIANT_DELETION_COUNT_SELECT,
    describeVariantDeletionBlockers,
    planVariantDeletion,
} from "@/core/helpers/productVariants/variantDeletionBlockers"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IProductVariantMatrixDependencies,
    IDeleteVariantMatrixSupplierEvent,
    IDeleteVariantMatrixVariantEvent,
    IBulkDeleteVariantMatrixVariantsEvent,
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
                    _count: { select: VARIANT_DELETION_COUNT_SELECT },
                },
            })
            if (!existing || existing.productId !== productId) {
                throw new createError.NotFound("Variant not found for this product")
            }

            const blockers = describeVariantDeletionBlockers(existing._count)
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

/**
 * Birden çok varyantı TEK işlemde siler.
 *
 * Tek tek çağırmak yerine toplu uç olmasının sebebi doğruluk: her silme
 * `recalculateProductVariantCodes` çalıştırır ve ölçü kodlarını yeniden
 * numaralayabilir. N ayrı çağrıda kodlar aralarda kayar, istemcinin elindeki
 * liste bayatlar. Burada silme toplu yapılır, kodlar SONDA bir kez hesaplanır.
 *
 * Engelli satır tüm işlemi düşürmez (kullanıcı kararı, 2026-08-25): silinebilenler
 * silinir, engelliler kodu ve sebebiyle döner.
 */
export const bulkDeleteVariantMatrixVariantsHandler = ({ productRepository }: IProductVariantMatrixDependencies) => {
    return async (event: IBulkDeleteVariantMatrixVariantsEvent) => {
        const { id: productId } = event.pathParameters
        const variantIds = [...new Set(event.body.variantIds)]

        try {
            const product = await productRepository.getProduct(productId)
            if (!product) throw new createError.NotFound("Product not found")

            const candidates = await prisma.productVariant.findMany({
                where: { id: { in: variantIds }, productId },
                select: {
                    id: true,
                    fullCode: true,
                    _count: { select: VARIANT_DELETION_COUNT_SELECT },
                },
            })

            // Başka ürünün varyantı ya da silinmiş id gönderilmişse sessizce
            // yutmuyoruz: kullanıcı neyin işlenmediğini görmeli.
            if (candidates.length !== variantIds.length) {
                const found = new Set(candidates.map((candidate) => candidate.id))
                const missing = variantIds.filter((id) => !found.has(id))
                throw new createError.NotFound(
                    `Bu ürüne ait olmayan veya bulunamayan varyant: ${missing.length} kayıt`,
                )
            }

            const plan = planVariantDeletion(
                candidates.map((candidate) => ({
                    id: candidate.id,
                    fullCode: candidate.fullCode,
                    counts: candidate._count,
                })),
            )

            if (plan.deletableIds.length === 0) {
                return apiResponseDTO({
                    statusCode: 200,
                    payload: { deletedIds: [], blocked: plan.blocked, removedSizes: 0, rewrittenCodes: 0 },
                })
            }

            const result = await prisma.$transaction(async (tx) => {
                await tx.productVariant.deleteMany({ where: { id: { in: plan.deletableIds } } })
                // Versiyon tanımları sözlükte kalır (numaraları kalıcı); yalnız
                // öksüz ölçüler temizlenir ve kodlar BİR KEZ yeniden hesaplanır.
                const orphans = await removeOrphanSizes(tx, productId)
                const recalculated = await recalculateProductVariantCodes(tx, productId)
                return { orphans, recalculated }
            }, { timeout: 15_000, maxWait: 10_000 })

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    deletedIds: plan.deletableIds,
                    blocked: plan.blocked,
                    removedSizes: result.orphans.sizes,
                    rewrittenCodes: result.recalculated.rewrittenCodes,
                },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err)
            throw new createError.InternalServerError("Varyantlar silinemedi")
        }
    }
}
