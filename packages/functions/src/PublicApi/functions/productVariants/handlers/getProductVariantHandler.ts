import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductVariantDependencies, IGetProductVariantEvent } from "@/functions/PublicApi/types/productVariants"

export const getProductVariantHandler = ({ productVariantRepository }: IProductVariantDependencies) => {
    return async (event: IGetProductVariantEvent) => {
        const { id } = event.pathParameters;

        try {
            const variant = await productVariantRepository.getProductVariant(id);
            if (!variant) throw new createError.NotFound("ProductVariant not found");

            return apiResponseDTO({
                statusCode: 200,
                payload: { productVariant: variant },
            });
        } catch (err) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new createError.NotFound("ProductVariant not found");
            console.error(err);
            throw new createError.InternalServerError("Failed to get product variant");
        }
    }
}
