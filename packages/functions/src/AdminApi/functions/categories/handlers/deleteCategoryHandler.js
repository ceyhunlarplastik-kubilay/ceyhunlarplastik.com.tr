import createError, { HttpError } from "http-errors";
import { deleteS3Objects } from "@/core/helpers/s3/deleteObjects";
import { apiResponseDTO } from "@/core/helpers/utils/api/response";
import { Prisma } from "@/prisma/generated/prisma/client";
export const deleteCategoryHandler = ({ categoryRepository, assetRepository }) => {
    return async (event) => {
        const id = event.pathParameters?.id;
        if (!id)
            throw new createError.BadRequest("Category id is required");
        try {
            const assets = await assetRepository.listAssetsByCategoryId(id);
            const assetKeys = assets.map(a => a.key);
            await deleteS3Objects(assetKeys);
            const category = await categoryRepository.deleteCategory(id);
            return apiResponseDTO({
                statusCode: 200,
                payload: { category },
            });
        }
        catch (err) {
            if (err instanceof HttpError)
                throw err;
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025")
                    throw new createError.NotFound(`Category not found`);
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to delete category");
        }
    };
};
