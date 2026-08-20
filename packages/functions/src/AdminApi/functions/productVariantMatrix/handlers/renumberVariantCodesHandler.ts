import createError, { HttpError } from "http-errors"

import { prisma } from "@/core/db/prisma"
import { recalculateProductVariantCodes } from "@/core/helpers/productVariants/productVariantMaintenance"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IProductVariantMatrixDependencies,
    IRenumberVariantCodesEvent,
} from "@/functions/AdminApi/types/productVariantMatrix"

/**
 * TÜM ölçü ve versiyon kodlarını baştan verir — kilidi YOK SAYAR.
 *
 * YIKICI: kodlar katalog, teklif veya sipariş üzerinden dışarı çıkmışsa geçmişle
 * uyumu bozar. Bu yüzden `content_editor`'a kapalı (yalnız owner/admin) ve istek
 * gövdesinde açık bir `confirm` bekler.
 */
export const renumberVariantCodesHandler = ({ productRepository }: IProductVariantMatrixDependencies) => {
    return async (event: IRenumberVariantCodesEvent) => {
        const { id: productId } = event.pathParameters

        try {
            const product = await productRepository.getProduct(productId)
            if (!product) throw new createError.NotFound("Product not found")

            const result = await prisma.$transaction(
                (tx) => recalculateProductVariantCodes(tx, productId, { forceRenumber: true }),
                { timeout: 15_000, maxWait: 10_000 },
            )

            return apiResponseDTO({
                statusCode: 200,
                payload: { result },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            console.error(err)
            throw new createError.InternalServerError("Failed to renumber variant codes")
        }
    }
}
