import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { generateMaterialAssetUpload } from "@/core/helpers/s3/presign"
import type { IMaterialDependencies, ICreateMaterialAssetUploadEvent } from "@/functions/AdminApi/types/materials"

export const createMaterialAssetUploadHandler = ({
    materialRepository,
}: Pick<IMaterialDependencies, "materialRepository">) => {
    return async (event: ICreateMaterialAssetUploadEvent) => {
        const { id } = event.pathParameters
        const { fileName, contentType, assetRole = "CERTIFICATE" } = event.body

        const material = await materialRepository.getMaterial(id)
        if (!material) throw new createError.NotFound("Material not found")

        if (contentType !== "application/pdf") {
            throw new createError.BadRequest("Only PDF certificate files are supported")
        }

        const presigned = await generateMaterialAssetUpload({
            materialId: id,
            assetRole,
            fileName,
            contentType,
        })

        return apiResponseDTO({
            statusCode: 200,
            payload: presigned,
        })
    }
}
