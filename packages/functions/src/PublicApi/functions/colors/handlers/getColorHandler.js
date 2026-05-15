import createError from "http-errors";
import { Prisma } from "@/prisma/generated/prisma/client";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
export const getColorHandler = ({ colorRepository }) => {
    return async (event) => {
        const id = event.pathParameters?.id;
        if (!id)
            throw new createError.BadRequest("Color id is required");
        try {
            const color = await colorRepository.getColor(id);
            return apiResponseDTO({
                statusCode: 200,
                payload: { color },
            });
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
                throw new createError.NotFound("Color not found");
            throw new createError.InternalServerError("Failed to get color");
        }
    };
};
