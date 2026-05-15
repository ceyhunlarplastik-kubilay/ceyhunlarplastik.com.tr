import createError from "http-errors";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { Prisma } from "@/prisma/generated/prisma/client";
export const deleteMaterialHandler = ({ materialRepository }) => {
    return async (event) => {
        const { id } = event.pathParameters;
        try {
            const deleted = await materialRepository.deleteMaterial(id);
            return apiResponseDTO({
                statusCode: 200,
                payload: { material: deleted },
            });
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025")
                    throw new createError.NotFound("Material not found");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to delete material");
        }
    };
};
