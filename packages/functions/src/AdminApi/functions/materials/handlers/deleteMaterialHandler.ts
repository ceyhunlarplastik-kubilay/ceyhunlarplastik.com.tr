import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { Prisma } from "@/prisma/generated/prisma/client"
import { IMaterialDependencies, IDeleteMaterialEvent } from "@/functions/AdminApi/types/materials"

export const deleteMaterialHandler = ({ materialRepository }: IMaterialDependencies) => {
    return async (event: IDeleteMaterialEvent) => {
        const { id } = event.pathParameters;

        try {
            const deleted = await materialRepository.deleteMaterial(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { material: deleted },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") throw new createError.NotFound("Material not found");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to delete material");
        }
    }
}
