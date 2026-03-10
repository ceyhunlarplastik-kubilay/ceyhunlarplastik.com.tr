import createError from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { ICategoryDependencies, IGetCategoryBySlugEvent } from "@/functions/PublicApi/types/categories"
import { mapCategoryWithAssets } from "@/core/helpers/assets/mapCategoryWithAssets"

export const getCategoryBySlugHandler = ({ categoryRepository }: ICategoryDependencies) => {
    return async (event: IGetCategoryBySlugEvent) => {
        const { slug } = event.pathParameters;

        try {
            const category = await categoryRepository.getCategoryBySlug(slug);

            return apiResponseDTO({
                statusCode: 200,
                payload: { category: mapCategoryWithAssets(category) },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new createError.NotFound("Category not found");
            console.error(err);
            throw new createError.InternalServerError("Failed to get category");
        }
    }
}
