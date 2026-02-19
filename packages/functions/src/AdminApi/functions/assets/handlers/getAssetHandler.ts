import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IAssetDependencies, IGetAssetEvent } from "@/functions/AdminApi/types/assets"

export const getAssetHandler = ({ assetRepository }: Pick<IAssetDependencies, "assetRepository">) => {
    return async (event: IGetAssetEvent) => {
        const { id } = event.pathParameters;

        try {
            const asset = await assetRepository.getAsset(id);
            if (!asset) throw new createError.NotFound("Asset not found");

            return apiResponseDTO({
                statusCode: 200,
                payload: { asset },
            });
        } catch (error) {
            console.error(error);
            throw new createError.InternalServerError("Failed to get asset");
        }
    }
}
