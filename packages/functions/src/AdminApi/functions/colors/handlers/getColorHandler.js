import createError, { HttpError } from "http-errors";
import { Prisma } from "@/prisma/generated/prisma/client";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const getColorHandler = ({ colorRepository }) => {
    return async (event) => {
        const { id } = event.pathParameters;
        try {
            // Soft delete is handled in the prisma extension, so we don't need to filter by isActive here
            const color = await colorRepository.getColor(id);
            return apiResponseDTO({
                statusCode: 200,
                payload: { color },
            });
        }
        catch (err) {
            if (err instanceof HttpError)
                throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new createError.NotFound("Color not found");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to get color");
        }
    };
};
