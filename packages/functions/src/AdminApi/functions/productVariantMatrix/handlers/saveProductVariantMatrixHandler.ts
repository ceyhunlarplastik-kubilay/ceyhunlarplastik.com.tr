import createError, { HttpError } from "http-errors"

import { prisma } from "@/core/db/prisma"
import { Prisma } from "@/prisma/generated/prisma/client"
import {
    canManageVariantSupplierMargins,
    stripVariantSupplierMargins,
} from "@/core/helpers/productVariants/supplierFieldVisibility"
import { upsertProductVariantRows } from "@/core/helpers/productVariants/productVariantWriter"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import {
    IProductVariantMatrixDependencies,
    ISaveVariantMatrixEvent,
} from "@/functions/AdminApi/types/productVariantMatrix"

/**
 * Matris ekranının toplu kaydı. Satır = ölçü değerleri + renk/hammadde + tedarikçi.
 *
 * Kodlar burada ÜRETİLMEZ; ölçü/versiyon/tedarikçi sözlükleri bul-ya-da-oluştur ile
 * çözülüp tüm kodlar `upsertProductVariantRows` içinde tek kaynaktan hesaplanır.
 */
export const saveProductVariantMatrixHandler = ({
    productVariantMatrixRepository,
    productRepository,
}: IProductVariantMatrixDependencies) => {
    return async (event: ISaveVariantMatrixEvent) => {
        const { id: productId } = event.pathParameters
        const { rows } = event.body

        try {
            const product = await productRepository.getProduct(productId)
            if (!product) throw new createError.NotFound("Product not found")

            const mayManageMargins = canManageVariantSupplierMargins(event.user)

            const normalizedRows = rows.map((row) => ({
                name: row.name,
                measurements: row.measurements,
                colorId: row.colorId ?? null,
                materialIds: row.materialIds ?? [],
                supplier: row.supplier
                    // Operatörün gönderdiği marj alanı SESSİZCE YOK SAYILIR —
                    // 400 dönmüyoruz çünkü istemci bunları hiç göstermiyor;
                    // amaç yetkisiz bir alanın kazara yazılmasını engellemek.
                    ? (mayManageMargins ? row.supplier : stripVariantSupplierMargins(row.supplier))
                    : null,
            }))

            const result = await prisma.$transaction(
                (tx) => upsertProductVariantRows(tx, { productId, rows: normalizedRows }),
                { timeout: 15_000, maxWait: 10_000 },
            )

            const matrix = await productVariantMatrixRepository.getMatrix(productId)

            return apiResponseDTO({
                statusCode: 200,
                payload: { result, matrix },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("Variant code conflict while saving the matrix")
            }
            console.error(err)
            throw new createError.InternalServerError("Failed to save product variant matrix")
        }
    }
}
