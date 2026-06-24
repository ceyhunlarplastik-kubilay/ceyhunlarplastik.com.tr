import createError, { HttpError } from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { mapMaterialWithAssets } from "@/core/helpers/assets/mapMaterialWithAssets"
import type { IMaterialDependencies, IGetMaterialEvent } from "@/functions/PublicApi/types/materials"

export const getMaterialHandler = ({ materialRepository }: IMaterialDependencies) => {
    return async (event: IGetMaterialEvent) => {
        const { id } = event.pathParameters

        try {
            const material = await materialRepository.getMaterial(id)
            if (!material) throw new createError.NotFound("Material not found")

            return apiResponseDTO({
                statusCode: 200,
                payload: {
                    material: mapMaterialWithAssets(material, { certificatesOnly: true }),
                },
            })
        } catch (error) {
            if (error instanceof HttpError) throw error
            console.error(error)
            throw new createError.InternalServerError("Failed to get material")
        }
    }
}
