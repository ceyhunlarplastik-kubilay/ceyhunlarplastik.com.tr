import createError from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IMaterialDependencies, IUpdateMaterialEvent } from "@/functions/AdminApi/types/materials"

export const updateMaterialHandler = ({ materialRepository }: IMaterialDependencies) => {
    return async (event: IUpdateMaterialEvent) => {
        const { id } = event.pathParameters;
        const body = event.body;

        try {
            const existing = await materialRepository.getMaterial(id);
            if (!existing) throw new createError.NotFound("Material not found");

            const updated = await materialRepository.updateMaterial(id, body);

            return apiResponseDTO({
                statusCode: 200,
                payload: { material: updated },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new createError.Conflict("Material name already exists");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to update material");
        }
    }
}
