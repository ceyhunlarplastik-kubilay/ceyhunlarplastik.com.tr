import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { mapMaterialWithAssets } from "@/core/helpers/assets/mapMaterialWithAssets"
import { IMaterialDependencies, IGetMaterialEvent } from "@/functions/AdminApi/types/materials"

export const getMaterialHandler = ({ materialRepository }: Pick<IMaterialDependencies, "materialRepository">) => {
    return async (event: IGetMaterialEvent) => {
        const { id } = event.pathParameters;

        try {
            const material = await materialRepository.getMaterial(id);
            if (!material) throw new createError.NotFound("Material not found");

            return apiResponseDTO({
                statusCode: 200,
                payload: { material: mapMaterialWithAssets(material) },
            });
        } catch (error) {
            if (error instanceof HttpError) throw error;
            console.error(error);
            throw new createError.InternalServerError("Failed to get material");
        }
    }
}
