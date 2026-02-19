import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { Prisma } from "@/prisma/generated/prisma/client"
import { IProductDependencies, IDeleteProductEvent } from "@/functions/AdminApi/types/products"

export const deleteProductHandler = ({ productRepository }: Pick<IProductDependencies, "productRepository">) => {
    return async (event: IDeleteProductEvent) => {
        const { id } = event.pathParameters;

        try {
            const deleted = await productRepository.deleteProduct(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { product: deleted },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") throw new createError.NotFound("Product not found");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to delete product");
        }
    }
}
