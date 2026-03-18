import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeDependencies, IGetProductAttributeEvent } from "@/functions/AdminApi/types/productAttributes"

export const getProductAttributeHandler = ({ productAttributeRepository }: IProductAttributeDependencies) => {
    return async (event: IGetProductAttributeEvent) => {
        const id = event.pathParameters?.id;

        if (!id) {
            throw new createError.BadRequest("id path parameter is required");
        }

        if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
            throw new createError.BadRequest("id must be a valid UUID");
        }

        try {
            const attribute = await productAttributeRepository.getProductAttribute(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { productAttribute: attribute },
            });
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new createError.NotFound("Product attribute not found");
            // console.error(err);
            throw new createError.InternalServerError("Failed to get product attribute");
        }
    }
}
