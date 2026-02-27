import createError from "http-errors"
import { Prisma } from "@/prisma/generated/prisma/client"
import { apiResponseDTO } from "@/core/helpers/utils/api/response"
import { IGetCategoryDependencies, IGetCategoryBySlugEvent } from "@/functions/AdminApi/types/categories"

export const getCategoryBySlugHandler = ({ categoryRepository }: IGetCategoryDependencies) => {
    return async (event: IGetCategoryBySlugEvent) => {
        const { slug } = event.pathParameters;

        try {
            const category = await categoryRepository.getCategoryBySlug(slug);

            return apiResponseDTO({
                statusCode: 200,
                payload: { category },
            })
        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new createError.NotFound("Category not found");
            console.error(err);
            throw new createError.InternalServerError("Failed to get category");
        }
    }
}
