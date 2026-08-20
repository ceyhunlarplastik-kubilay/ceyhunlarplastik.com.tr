import createError, { HttpError } from "http-errors"

import { prisma } from "@/core/db/prisma"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IProductVariantMatrixDependencies,
    ISetVariantCodeLockEvent,
} from "@/functions/AdminApi/types/productVariantMatrix"

/**
 * Kod kilidini açar/kapatır.
 *
 * KİLİTLEME güvenlidir: mevcut kodlar dondurulur, yeni ölçüler sona eklenir.
 * KİLİT AÇMA tek başına hiçbir kodu değiştirmez — ama sonraki her kayıt taslak
 * modda çalışacağı için kodlar yeniden sıralanabilir. Bu yüzden kilidi açmak
 * yönetici işidir ve arayüzde uyarı ister.
 */
export const setVariantCodeLockHandler = ({ productRepository }: IProductVariantMatrixDependencies) => {
    return async (event: ISetVariantCodeLockEvent) => {
        const { id: productId } = event.pathParameters
        const { locked } = event.body

        try {
            const product = await productRepository.getProduct(productId)
            if (!product) throw new createError.NotFound("Product not found")

            const updated = await prisma.product.update({
                where: { id: productId },
                data: {
                    variantCodesLockedAt: locked ? new Date() : null,
                    variantCodesLockedByUserId: locked ? event.user.dbUserId : null,
                },
                select: { id: true, variantCodesLockedAt: true, variantCodesLockedByUserId: true },
            })

            return apiResponseDTO({
                statusCode: 200,
                payload: { product: updated },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err)
            throw new createError.InternalServerError("Failed to update variant code lock")
        }
    }
}
