import createError, { HttpError } from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IGetCategoryDependencies, IGetCategoryEvent } from "@/functions/AdminApi/types/categories"
import { mapCategoryWithAssets } from "@/core/helpers/assets/mapCategoryWithAssets"

export const getCategoryHandler = ({ categoryRepository }: IGetCategoryDependencies) => {
    return async (event: IGetCategoryEvent) => {
        const { id } = event.pathParameters;

        try {
            const category = await categoryRepository.getCategory(id);

            return apiResponseDTO({
                statusCode: 200,
                payload: { category: mapCategoryWithAssets(category) },
            })
        } catch (err: any) {
            if (err instanceof HttpError) throw err
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                throw new createError.NotFound("Category not found");
            }
            console.error(err);
            throw new createError.InternalServerError("Failed to get category");
        }
    }
}
