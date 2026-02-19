import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { Prisma } from "@/prisma/generated/prisma/client"
import { IProductVariantDependencies, IDeleteProductVariantEvent } from "@/functions/AdminApi/types/productVariants"

export const deleteProductVariantHandler = ({ productVariantRepository }: IProductVariantDependencies) => {
    return async (event: IDeleteProductVariantEvent) => {
        const { id } = event.pathParameters;

        try {
            const deleted = await productVariantRepository.deleteProductVariant(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { productVariant: deleted },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") throw new createError.NotFound("ProductVariant not found");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to delete product variant");
        }
    }
}
