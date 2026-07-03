import createError, { HttpError } from "http-errors"
import { deleteS3Objects } from "@/core/helpers/s3/deleteObjects"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { Prisma } from "@/prisma/generated/prisma/client"
import {
    IProductAttributeValueDependencies, IDeleteProductAttributeValueEvent
} from "@/functions/AdminApi/types/productAttributeValues"

export const deleteProductAttributeValueHandler = ({ productAttributeValueRepository }: IProductAttributeValueDependencies) => {
    return async (event: IDeleteProductAttributeValueEvent) => {
        const { id } = event.pathParameters

        try {
            const value = await productAttributeValueRepository.getValueById(id)
            if (!value) {
                throw new createError.NotFound("Değer bulunamadı")
            }

            const blockers = await productAttributeValueRepository.getDeleteBlockers(id)
            const isUsed = Object.values(blockers).some((count) => count > 0)

            if (isUsed) {
                throw new createError.Conflict(
                    "Bu değer kullanımda olduğu için silinemez. Önce bağlı kayıtları kaldırın."
                )
            }

            const assetKeys = value.assets.map((asset) => asset.key)

            try {
                await deleteS3Objects(assetKeys)
            } catch (error) {
                console.error("Product attribute value asset cleanup failed:", error)
                throw new createError.InternalServerError("Görsel silinemedi, işlem tamamlanmadı")
            }

            const deleted = await productAttributeValueRepository.deleteValue(id)

            return apiResponseDTO({
                statusCode: 200,
                payload: { success: true, value: deleted }
            })
        } catch (error) {
            if (error instanceof HttpError) throw error
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                throw new createError.NotFound("Değer bulunamadı")
            }

            console.error(error)
            throw new createError.InternalServerError("Değer silinemedi")
        }
    }
}
