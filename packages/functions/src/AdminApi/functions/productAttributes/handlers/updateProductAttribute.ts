import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IProductAttributeDependencies, IUpdateProductAttributeEvent } from "@/functions/AdminApi/types/productAttributes"

export const updateProductAttributeHandler = ({ productAttributeRepository }: IProductAttributeDependencies) => {
    return async (event: IUpdateProductAttributeEvent) => {
        const { id } = event.pathParameters;
        const body = event.body;

        try {
            const existing = await productAttributeRepository.getProductAttribute(id);
            if (!existing) throw new createError.NotFound("Product attribute not found");

            const updated = await productAttributeRepository.updateProductAttribute(id, body);

            return apiResponseDTO({
                statusCode: 200,
                payload: { attribute: updated },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("Product attribute name already exists");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to update product attribute");
        }
    }
}
