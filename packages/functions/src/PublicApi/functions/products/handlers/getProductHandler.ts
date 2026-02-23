import createError from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductDependencies, IGetProductEvent } from "@/functions/PublicApi/types/products"

export const getProductHandler = ({ productRepository }: Pick<IProductDependencies, "productRepository">) => {
    return async (event: IGetProductEvent) => {
        const { id } = event.pathParameters;

        try {
            const product = await productRepository.getProduct(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { product },
            });
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new createError.NotFound("Product not found");
            throw new createError.InternalServerError("Failed to get product");
        }
    }
}
