import createError from "http-errors"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { Prisma } from "@/prisma/generated/prisma/client"
import { IAssetDependencies, IDeleteAssetEvent } from "@/functions/AdminApi/types/assets"

export const deleteAssetHandler = ({ assetRepository }: Pick<IAssetDependencies, "assetRepository">) => {
    return async (event: IDeleteAssetEvent) => {
        const { id } = event.pathParameters;

        try {
            const deleted = await assetRepository.deleteAsset(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { asset: deleted },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") throw new createError.NotFound("Asset not found");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to delete asset");
        }
    }
}
