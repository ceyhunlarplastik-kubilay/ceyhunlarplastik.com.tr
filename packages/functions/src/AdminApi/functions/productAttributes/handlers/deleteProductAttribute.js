import createError, { HttpError } from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { Prisma } from "@/prisma/generated/prisma/client";
export const deleteProductAttributeHandler = ({ productAttributeRepository }) => {
    return async (event) => {
        const id = event.pathParameters?.id;
        if (!id)
            throw new createError.BadRequest("Product attribute id is required");
        try {
            const attribute = await productAttributeRepository.deleteProductAttribute(id);
            return apiResponseDTO({
                statusCode: 200,
                payload: { attribute },
            });
        }
        catch (err) {
            if (err instanceof HttpError)
                throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025")
                    throw new createError.NotFound(`Product attribute not found`);
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to delete product attribute");
        }
    };
};
