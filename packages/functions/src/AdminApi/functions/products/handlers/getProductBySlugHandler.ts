import createError from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductDependencies, IGetProductBySlugEvent } from "@/functions/AdminApi/types/products"
import { mapProductWithAssets } from "@/core/helpers/assets/mapProductWithAssets"

export const getProductBySlugHandler = ({ productRepository }: Pick<IProductDependencies, "productRepository">) => {
    return async (event: IGetProductBySlugEvent) => {
        const { slug } = event.pathParameters;

        try {
            const product = await productRepository.getProductBySlug(slug);

            return apiResponseDTO({
                statusCode: 200,
                payload: { product: mapProductWithAssets(product) },
            });
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new createError.NotFound("Product not found");
            throw new createError.InternalServerError("Failed to get product");
        }
    }
}
