import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IMaterialDependencies, IGetMaterialEvent } from "@/functions/AdminApi/types/materials"

export const getMaterialHandler = ({ materialRepository }: IMaterialDependencies) => {
    return async (event: IGetMaterialEvent) => {
        const { id } = event.pathParameters;

        try {
            const material = await materialRepository.getMaterial(id);
            if (!material) throw new createError.NotFound("Material not found");

            return apiResponseDTO({
                statusCode: 200,
                payload: { material },
            });
        } catch (error) {
            console.error(error);
            throw new createError.InternalServerError("Failed to get material");
        }
    }
}
