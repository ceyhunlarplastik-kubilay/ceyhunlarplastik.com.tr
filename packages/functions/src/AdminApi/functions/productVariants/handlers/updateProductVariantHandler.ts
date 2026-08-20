import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantDependencies, IUpdateProductVariantEvent } from "@/functions/AdminApi/types/productVariants"

/**
 * Varyantın yalnız ADINI günceller.
 *
 * Ölçü, renk/hammadde ve tedarikçi bağı burada DEĞİŞTİRİLEMEZ — bunlar varyantın
 * kimliğini (ve dolayısıyla kodunu) belirler; değiştirmek ürünün tüm kod düzenini
 * etkileyeceği için `upsertProductVariantRows` üzerinden giden matris akışına aittir.
 * Tedarikçi ticari alanları ise `/product-variant-suppliers` yüzeyinden yönetilir.
 */
export const updateProductVariantHandler = ({ productVariantRepository }: IProductVariantDependencies) => {
    return async (event: IUpdateProductVariantEvent) => {
        const { id } = event.pathParameters
        const { name } = event.body

        try {
            const existing = await productVariantRepository.getProductVariant(id)
            if (!existing) throw new createError.NotFound("Variant not found")

            const updated = await productVariantRepository.updateProductVariant(id, { name })

            return apiResponseDTO({
                statusCode: 200,
                payload: { productVariant: updated },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("Variant unique constraint conflict");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to update product variant");
        }
    }
}
