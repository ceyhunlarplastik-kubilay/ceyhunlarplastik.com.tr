import createError from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantDependencies, IGetProductVariantEvent } from "@/functions/AdminApi/types/productVariants"

export const getProductVariantHandler = ({ productVariantRepository }: IProductVariantDependencies) => {
    return async (event: IGetProductVariantEvent) => {

        const { id } = event.pathParameters;

        try {
            const variant = await productVariantRepository.getProductVariant(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { productVariant: variant },
            });
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new createError.NotFound("Product not found");
            throw new createError.InternalServerError("Failed to get product");
        }
    }
}
